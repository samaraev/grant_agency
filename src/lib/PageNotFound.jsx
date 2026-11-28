import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <main className="public-site flex min-h-screen items-center justify-center bg-background px-5 py-16">
            <div className="w-full max-w-xl border border-border bg-card p-7 sm:p-10">
                <Link to="/" className="inline-flex items-center gap-3" aria-label="ГРАНТ — home">
                    <span className="h-9 w-[3px] bg-primary" aria-hidden="true" />
                    <span className="flex flex-col leading-none">
                        <span className="text-[17px] font-bold tracking-[0.14em] text-foreground">ГРАНТ</span>
                        <span className="mt-1 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                            Real estate
                        </span>
                    </span>
                </Link>

                <div className="mt-12 border-b border-border pb-8">
                    <p className="font-mono text-[13px] tracking-[0.2em] text-primary">404</p>
                    <h1 className="mt-4 text-[36px] font-medium leading-tight text-foreground sm:text-[44px]">
                        Page not found
                    </h1>
                    <p className="mt-4 break-words text-[14px] leading-relaxed text-muted-foreground">
                        The page <span className="font-medium text-foreground">“{pageName}”</span> could not be found in this application.
                    </p>
                </div>

                {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                    <div className="mt-6 border border-border bg-muted p-4">
                        <p className="text-[13px] font-semibold text-foreground">Admin note</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                            This page may not have been implemented yet. Ask to implement it in the chat.
                        </p>
                    </div>
                )}

                <Link
                    to="/"
                    className="mt-7 inline-flex min-h-[46px] items-center justify-center bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                    Go home
                </Link>
            </div>
        </main>
    );
}