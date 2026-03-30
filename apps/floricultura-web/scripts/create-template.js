const XLSX = require('xlsx');
const path = require('path');

const templateData = [
  {
    categoria_nome: 'Buquês',
    categoria_slug: 'buques',
    produto_nome: 'Buquê de Rosas Vermelhas',
    descricao_curta: 'Lindo buquê com 12 rosas vermelhas',
    descricao: 'Buquê elegante com 12 rosas vermelhas frescas, embalagem sofisticada e laço de cetim',
    preco: 159.90,
    preco_comparacao: 199.90,
    ativo: true,
    destaque: true,
    imagem_capa_url: '',
    imagem_extra_url_1: '',
    imagem_extra_url_2: '',
    imagem_extra_url_3: '',
  },
];

const worksheet = XLSX.utils.json_to_sheet(templateData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

const outputPath = path.join(__dirname, '..', 'public', 'templates', 'import-produtos-v1.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Template criado em:', outputPath);
