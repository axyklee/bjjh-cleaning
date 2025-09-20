import { Button } from "~/components/ui/button";
import { auth, signIn, signOut } from "~/server/auth";

type SubjectProps = {
    panel?: React.ReactNode;
    children?: React.ReactNode;
};

export default async function Header({ panel, children }: SubjectProps) {
    const session = await auth();

    return (
        <div className="m-3">
            <header className="flex flex-col p-3 rounded-lg shadow bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex flex-col lg:flex-row mb-0 w-full items-start">
                            <img className="h-7 mb-0 lg:mb-0 lg:mr-2 object-contain" src="/bjjh.png" alt="" />
                            <h1 className="text-xl font-bold">掃區評比系統</h1>
                        </div>
                        <div>{panel}</div>
                    </div>
                    {
                        session?.user ? (
                            <div className="flex items-center gap-4">
                                <p>您好, {session.user.name}</p>
                                <Button variant={"default"} onClick={async () => {
                                    "use server"
                                    await signOut({
                                        redirectTo: "/",
                                        redirect: true
                                    })
                                }}>
                                    登出
                                </Button>
                            </div>
                        ) : (<Button variant={"default"} onClick={async () => {
                            "use server"
                            await signIn("google", {
                                callbackUrl: "/admin",
                                redirectTo: "/admin",
                                redirect: true,
                            })
                        }}>
                            管理員登入
                        </Button>)
                    }
                </div>
            </header>
            <main className="container mx-auto mt-10">
                {children}
            </main>
        </div>);
}