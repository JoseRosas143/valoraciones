'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileText, MoreVertical, Stethoscope, Loader2 } from 'lucide-react';

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
          <Stethoscope className="h-7 w-7 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
            MediScribe Assist
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
