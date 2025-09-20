import Header from "~/app/_components/header";

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Header>
            {children}
        </Header>
    );
}