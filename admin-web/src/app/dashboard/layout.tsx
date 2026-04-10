import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-[280px] overflow-y-auto flex flex-col scrollbar-thin">
                <TopBar />
                <div className="flex-1 bg-muted/30">
                    {children}
                </div>
            </main>
        </div>
    )
}
