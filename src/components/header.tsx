
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
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#A0CFEC', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#68A4C4', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" stroke="#E0E0E0" strokeWidth="2"/>
      <path
        d="M42,68 C50,60 52,55 52,50 C52,45 50,40 42,32 M60,68 C52,60 50,55 50,50 C50,45 52,40 60,32"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
       <path
        d="M40,50 h20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
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
          <BonicaScribeLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
            BonicaScribe
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
