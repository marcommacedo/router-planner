import { createContext, useEffect, useState } from "react"
import { useCookies } from "react-cookie"
import User from "../../model/User"
import { initFirebase } from "../../firebase/config"
import {
  User as userFirebase,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth"
import { useRouter } from "next/router"

interface IAuthContext {
  user?: User
  loading?: boolean
  signIn?: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>
  signUp?: (email: string, password: string) => Promise<void>
  signInGoogle?: () => Promise<void>
  forgotPassword?: (email: string) => Promise<void>
  logout?: () => Promise<void>
}

const AuthContext = createContext<IAuthContext>({})

async function formatUser(userFirebase: userFirebase): Promise<User> {
  const token = await userFirebase.getIdToken()
  return {
    uid: userFirebase.uid,
    name: userFirebase.displayName,
    email: userFirebase.email,
    token,
    imgUrl: userFirebase.photoURL,
  }
}

export function AuthProvider(props: any) {
  const router = useRouter()
  const [cookies, setCookie, removeCookie] = useCookies([
    "meeting-organizer-auth",
  ])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User>()

  const manageCookie = async (logged: boolean, rememberMe?: boolean) => {
    if (logged) {
      setCookie("meeting-organizer-auth", logged, {
        expires: rememberMe
          ? new Date(Date.now() + 12096e5)
          : new Date(Date.now() + 36000),
        sameSite: true,
      })
    } else {
      removeCookie("meeting-organizer-auth")
    }
  }

  initFirebase()
  const auth = getAuth()

  const configSession = async (userFirebase: userFirebase) => {
    if (userFirebase?.email) {
      const user = await formatUser(userFirebase)
      setUser(user)
      setLoading(false)
      return user.email
    } else {
      setUser(null as any)
      setLoading(true)
      return false
    }
  }

  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      await configSession(res.user)
      await manageCookie(true, rememberMe)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const res = await signInWithPopup(auth, provider)
    await configSession(res.user)
    await manageCookie(true, true)
    router.push("/")
  }

  const signUp = async (email: string, password: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      await configSession(res.user)
      await manageCookie(true)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      console.log(e)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      await configSession(null as any)
      await manageCookie(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cookies["meeting-organizer-auth"]) {
      const cancel = onIdTokenChanged(auth, configSession as any)
      return cancel
    } else {
      setLoading(false)
    }
  }, [auth, cookies])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInGoogle,
        forgotPassword,
        logout,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  )
}

export default AuthContext
