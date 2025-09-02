
'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileText, MoreVertical, Loader2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

// Custom BonicaScribe Logo Component
const BonicaScribeLogo = ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M85.34,64.21A40,40,0,1,1,95,50"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50,75V35"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M58,51s-4-3-4-6,4-6,4-6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42,63s4,3,4,6-4,6-4,6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
       <path
        d="M46,45a10.5,10.5,0,1,0,0,18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54,71.5a10.5,10.5,0,1,0,0-18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
);

interface HeaderProps {
  onExportPdf: () => void;
  onExportDoc: () => void;
  isExportingPdf: boolean;
}

export function Header({ onExportPdf, onExportDoc, isExportingPdf }: HeaderProps) {
  return (
    <header className="bg-card border-b p-4 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden"/>
          <BonicaScribeLogo className="h-7 w-7 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
            BonicaScribe Assist
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExportPdf} className="hidden md:flex" disabled={isExportingPdf}>
            {isExportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileText className="mr-2 h-4 w-4" />
            )}
            Exportar a PDF
          </Button>
          <Button variant="outline" onClick={onExportDoc} className="hidden md:flex">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar a DOC
          </Button>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Más opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportPdf} disabled={isExportingPdf}>
                  {isExportingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <FileText className="mr-2 h-4 w-4" />
                  )}
                  <span>Exportar a PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportDoc}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Exportar a DOC</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
