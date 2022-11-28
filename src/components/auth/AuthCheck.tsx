import { useRouter } from "next/router"
import Script from "next/script"
import useAuth from "../../data/hook/useAuth"

export default function AuthCheck(props: any) {
  const router = useRouter()
  const { user, loading } = useAuth()

  function renderContent() {
    return (
      <>
        <Script
          id="scriptCheckAuth"
          dangerouslySetInnerHTML={{
            __html: `
                    if(!document.cookie?.includes("meeting-organizer-auth")) {
                        window.location.href = "/signIn"
                    }
                `,
          }}
        />
        {props.children}
      </>
    )
  }

  function renderLoading() {
    return <div>Loading</div>
  }

  if (!loading && user?.email) {
    return renderContent()
  } else if (loading) {
    return renderLoading()
  } else {
    router.push("/signIn")
    return <></>
  }
}
