'use client';

import { useState } from 'react';
import { Button } from '@flordoestudante/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { Alert, AlertDescription } from '@flordoestudante/ui';
import { FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importProductsFromXlsxAction } from '@/features/admin/product-import-actions';
import Link from 'next/link';

type ImportStage = 'download' | 'upload' | 'importing' | 'result';

interface ImportResultData {
  totalRows?: number;
  importedRows?: number;
  failedRows?: number;
  errorReport?: Array<{ row: number; field?: string; message: string }>;
}

export function AdminProductsImportClient() {
  const [stage, setStage] = useState<ImportStage>('download');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStage('upload');
      setErrorMessage(null);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;

    setStage('importing');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const importResult = await importProductsFromXlsxAction(formData);

    if (importResult.ok) {
      setResult({
        totalRows: importResult.totalRows,
        importedRows: importResult.importedRows,
        failedRows: importResult.failedRows,
        errorReport: importResult.errorReport,
      });
      setStage('result');
    } else {
      setErrorMessage(importResult.message);
      setStage('upload');
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    setStage('download');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">
            Importar produtos por planilha
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre vários produtos de uma só vez usando uma planilha Excel
          </p>
        </div>
        <Link
          href="/admin/produtos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Produtos
        </Link>
      </div>

      {stage === 'download' || stage === 'upload' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Passo 1: Baixar planilha modelo
              </CardTitle>
              <CardDescription>
                Use nosso modelo com as colunas corretas para garantir uma importação sem erros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild>
                <a href="/templates/import-produtos-v1.xlsx" download>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Baixar modelo (.xlsx)
                </a>
              </Button>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <p className="mb-2 font-medium">Campos da planilha:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <strong>categoria_nome</strong> (obrigatório) — Nome da categoria
                  </li>
                  <li>
                    <strong>categoria_slug</strong> (opcional) — Slug customizado para a categoria
                  </li>
                  <li>
                    <strong>produto_nome</strong> (obrigatório) — Nome do produto
                  </li>
                  <li>
                    <strong>descricao_curta</strong> (opcional) — Descrição breve
                  </li>
                  <li>
                    <strong>descricao</strong> (opcional) — Descrição completa
                  </li>
                  <li>
                    <strong>preco</strong> (obrigatório) — Preço em reais (ex.: 159.90)
                  </li>
                  <li>
                    <strong>preco_comparacao</strong> (opcional) — Preço original para comparação
                  </li>
                  <li>
                    <strong>ativo</strong> (opcional) — true/false (padrão: true)
                  </li>
                  <li>
                    <strong>destaque</strong> (opcional) — true/false (padrão: false)
                  </li>
                  <li>
                    <strong>imagem_capa_url</strong> (opcional) — URL da imagem principal
                  </li>
                  <li>
                    <strong>imagem_extra_url_1, 2, 3</strong> (opcionais) — URLs de imagens adicionais
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Passo 2: Fazer upload da planilha preenchida
              </CardTitle>
              <CardDescription>
                Envie sua planilha com os produtos. Tamanho máximo: 5 MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 p-8 transition-colors hover:border-primary hover:bg-muted/60"
                >
                  <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
                  <span className="mb-2 text-sm font-medium">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Formatos aceitos: .xlsx, .xls
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>

                {selectedFile && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedFile(null)} variant="ghost" size="sm">
                      Remover
                    </Button>
                  </div>
                )}

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile}
                  size="lg"
                  className="w-full"
                >
                  Importar produtos
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {stage === 'importing' ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Processando planilha...</p>
            <p className="text-sm text-muted-foreground">
              Criando categorias e produtos. Isso pode levar alguns instantes.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {stage === 'result' && result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failedRows === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
              Importação concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{result.totalRows}</p>
                <p className="text-sm text-muted-foreground">Total de linhas</p>
              </div>
              <div className="rounded-lg border border-border bg-green-50 p-4 text-center dark:bg-green-950/30">
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {result.importedRows}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">Importados</p>
              </div>
              <div className="rounded-lg border border-border bg-red-50 p-4 text-center dark:bg-red-950/30">
                <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {result.failedRows}
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">Com erro</p>
              </div>
            </div>

            {result.errorReport && result.errorReport.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Erros encontrados:</h3>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4">
                  {result.errorReport.map((err, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-destructive">Linha {err.row}:</span>{' '}
                      {err.field && <span className="text-muted-foreground">[{err.field}]</span>}{' '}
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleReset}>Importar outra planilha</Button>
              <Button asChild variant="outline">
                <Link href="/admin/produtos">Ver produtos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
