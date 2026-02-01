import { EmptyBlock } from "@/components/ui-states/empty-block"

export const NotFoundPage = () => {
    return (
        <div className="flex flex-col gap-6">
            <EmptyBlock
                title="Page not found"
                description="The page you are looking for does not exist."
                actionLabel="Back to dashboard"
                actionTo="/"
            />
        </div>
    )
}
