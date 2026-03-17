import { useRef, useState } from 'react';
import {
    Archive,
    File,
    Inbox,
    Search,
    Send,
    Copy,
    Check,
    Settings,
    RefreshCw
} from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { AccountSwitcher } from './AccountSwitcher';
import { Nav } from './Nav';
import { MailList } from './MailList';
import { MailDisplay } from './MailDisplay';
import { useMail } from './useMail';
import { Button, buttonVariants } from '../ui/button';
import type { MailsList } from './data';

interface Account {
    id: number
    email_address: string
}


interface MailProps {
    accounts: Account[]
    mails: MailsList[]
    defaultLayout: number[] | undefined
    defaultCollapsed?: boolean
    navCollapsedSize: number
}

export default ({
    accounts,
    mails,
    defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize,
}: MailProps) => {
    const abortController = useRef<AbortController | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [loading, setLoading] = useState<boolean>(false);
    const [mailsList, setMailsList] = useState<MailsList[]>(mails);
    const [isCopy, setIsCopy] = useState<boolean>(false);
    const [currentAccount, setCurrentAccount] = useState<Account>(accounts[0]);
    const [copiedText, copy] = useCopyToClipboard();
    const [mail] = useMail();
    const fetchData = async (id?: number) => {
        if (!id) return;
        try {
            setLoading(true);
            abortController.current?.abort();
            abortController.current = new AbortController();
            const response = await fetch(`/api/getMails?id=${id}`, { signal: abortController.current.signal });
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const data = await response.json();
            if (data.code === 502) {
                // redirect to login page
                window.location.href = '/sign-in';
            }
            setMailsList(data?.mails || []);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
        abortController.current = null;
    }
    const handleAccountChange = (email: string) => {
        const currentAccount = accounts.find((account) => account.email_address === email) || accounts[0];
        setCurrentAccount(currentAccount);
        fetchData(currentAccount?.id);
    }
    const updateStatus = (messageId: string, status: number = 0) => {
        setMailsList(mailsList.map(item => {
            if (item.message_id === messageId) item.is_read = status;
            return item;
        }));
    }
    const handleUnread = async (messageId?: string) => {
        if (!messageId) return true;
        const response = await fetch('/api/updateStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message_id: messageId, is_read: 0 }),
        })
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200) {
                updateStatus(messageId);
                return true;
            }
        }
        return false;
    }
    const toDelete = async (messageId?: string) => {
        if (!messageId) return true;
        const response = await fetch('/api/deleteMails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message_id: messageId }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200) {
                setMailsList(mailsList.filter(e => e.message_id !== messageId));
                toast.success('Delete Success!');
                return true;
            }
            toast.error(data.message);
        }
        return false;
    }
    const toCopy = () => {
        if (isCopy) return;
        copy(currentAccount.email_address)
            .then(() => {
                setIsCopy(true);
                toast.success('Copied!');
                setTimeout(() => {
                    setIsCopy(false);
                }, 1500);
            })
            .catch((error) => {
                console.error('Failed to copy!', error);
            });
    }
    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                        sizes
                    )}`
                }}
                className="h-full flex-1 items-stretch"
            >
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={20}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn("flex flex-col", isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
                >
                    <div className={cn("flex h-[52px] items-center justify-center", isCollapsed ? "h-[52px]" : "px-2")}>
                        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} onAccountChange={handleAccountChange} />
                    </div>
                    <Separator />
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Inbox",
                                label: mailsList.length ? `${mailsList.length}` : "",
                                icon: Inbox,
                                variant: "default",
                            },
                            {
                                title: "Drafts",
                                label: "",
                                icon: File,
                                variant: "ghost",
                            },
                            {
                                title: "Sent",
                                label: "",
                                icon: Send,
                                variant: "ghost",
                            },
                            {
                                title: "Archive",
                                label: "",
                                icon: Archive,
                                variant: "ghost",
                            },
                        ]}
                    />
                    <Separator />
                    <div className='flex-1'></div>
                    <div className='py-4 px-2'>
                        <a href='./settings' className={cn('w-full', buttonVariants({ variant: 'outline'}))}>
                            <Settings />
                            {isCollapsed ? '' : `My email addresses (${accounts.length})`}
                        </a>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={20}>
                    <div className="flex items-center px-4 py-2">
                        <h1 className="text-xl font-bold">Inbox</h1>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='ml-auto'
                                    disabled={loading}
                                    onClick={() => fetchData(currentAccount.id)}
                                >
                                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                                    <span className='sr-only'>Refresh</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh inbox</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className=''
                                    disabled={isCopy}
                                    onClick={toCopy}
                                >
                                    {isCopy ? <Check size={16} color='green' /> :
                                        <>
                                            <Copy className='h-4 w-4' />
                                            <span className='sr-only'>Copy</span>
                                        </>
                                    }
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy current email address</TooltipContent>
                        </Tooltip>
                    </div>
                    <Separator />
                    <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <form>
                            <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search" className="pl-8" />
                            </div>
                        </form>
                    </div>
                    {loading ? <div className='px-4'>
                        <div className='flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all'>
                            <Skeleton className='w-3/4 h-3' />
                            <Skeleton className='w-1/4 h-3' />
                            <Skeleton className='w-3/4 h-2' />
                        </div>
                    </div> : <MailList items={mailsList} updateStatus={(messageId) => updateStatus(messageId, 1)} />}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
                    <MailDisplay
                        mail={mailsList.find((item) => item.message_id === mail.selected) || null}
                        currentAccount={currentAccount.email_address}
                        toDelete={toDelete}
                        handleUnread={handleUnread}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
            <Toaster />
        </TooltipProvider>
    );
};