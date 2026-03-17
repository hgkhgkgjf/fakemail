import { useState } from 'react';
import { Copy, Check, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useGeneratorMail } from '@/hooks/useGeneratorMail';

export default () => {
    const [address, generatorNewMail] = useGeneratorMail();
    const [isCopy, setIsCopy] = useState<boolean>(false);
    const [copiedText, copy] = useCopyToClipboard();
    const [open, setOpen] = useState(false);
    const handleFocus = (event: any) => event.target.select();
    const handleCopy = (text: string) => {
        if (isCopy) return;
        copy(text)
            .then(() => {
                setIsCopy(true);
                setTimeout(() => {
                    setIsCopy(false);
                }, 1500);
            })
            .catch((error) => {
                console.error('Failed to copy!', error);
            });
    };
    return (
        <TooltipProvider delayDuration={0}>
            <div className='flex flex-col items-center gap-3 sm:flex-row'>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Input
                            className='sm:flex-1 rounded-full border-none text-center sm:text-left bg-slate-800/40 dark:bg-slate-600/40 px-8 py-6 text-sm md:text-xl text-white'
                            readOnly
                            onFocus={handleFocus}
                            value={address}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Your fake email address</p>
                    </TooltipContent>
                </Tooltip>
            <div className='flex gap-3 items-center'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='outline'
                                className='rounded-full py-6 px-8 shrink-0 sm:px-4'
                                onClick={() => handleCopy(address)}
                            >
                                {isCopy ? <Check /> : <Copy />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Copy to clipboard</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='destructive'
                                className='rounded-full py-6 shrink-0'
                                onClick={() => setOpen(true)}
                            >
                                <RotateCw /> Change
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Generate a new email address</p>
                        </TooltipContent>
                    </Tooltip>
                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Generate a new address?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will discard the current temporary address and create a new one. You will no longer receive mail at the old address.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button onClick={generatorNewMail}>Yes, generate new address</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </TooltipProvider>
    );
};
