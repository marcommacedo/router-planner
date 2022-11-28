import AuthCheck from "../auth/AuthCheck"

interface ILayout {
  public?: boolean
  children?: any
}

export default function Layout(props: ILayout) {
  return props.public ? (
    <>{props.children}</>
  ) : (
    <div>
      <AuthCheck>
        <div>
          <div>{props.children}</div>
        </div>
      </AuthCheck>
    </div>
  )
}
