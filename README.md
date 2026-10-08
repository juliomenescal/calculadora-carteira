# Calculadora de Aportes

Aplicação pessoal, mobile-first, para calcular compras inteiras de ações e aproximar uma carteira dos pesos-alvo. Tudo roda no navegador: não há backend, banco de dados ou API externa.

## Recursos

- quatro ativos iniciais: ITUB4, BPAC11, BBDC4 e BBAS3;
- pesos editáveis com validação de soma em 100%;
- dois modos: melhor equilíbrio e uso máximo do aporte;
- quantidades e pesos salvos automaticamente no `localStorage`;
- confirmação da compra atualiza a carteira local;
- interface responsiva em português e valores em reais.

## Instalação e execução

Requer Node.js 20.9 ou mais recente.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Comandos de validação:

```bash
npm run typecheck
npm test
npm run build
```

## Alterar ativos e pesos padrão

Edite `DEFAULT_ASSETS` em `components/InvestmentCalculator.tsx`. O peso é armazenado como fração: `0.4` representa 40%. A soma dos pesos deve ser `1`.

## Como funciona o algoritmo

A lógica fica isolada em `lib/optimizer.ts`. Para aportes normais, ela testa todas as combinações inteiras que cabem no orçamento. O modo **Melhor equilíbrio** minimiza a soma dos erros quadráticos dos pesos finais e aplica uma pequena penalidade à sobra. O parâmetro `LEFTOVER_LAMBDA` controla essa penalidade. O modo **Usar o máximo** minimiza a sobra primeiro e usa o erro dos pesos como desempate.

Quando o número teórico de combinações passa de `MAX_COMBINATIONS`, uma busca heurística limitada mantém a interface responsiva e ainda considera a carteira atual, as metas e os preços.

## GitHub

Crie um repositório, versionando os arquivos do projeto (sem `node_modules` nem `.next`):

```bash
git init
git add .
git commit -m "Cria calculadora de aportes"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

## Deploy na Vercel

1. Importe o repositório no painel da Vercel.
2. Mantenha o preset **Next.js** e os comandos padrão.
3. Clique em **Deploy**. Não são necessárias variáveis de ambiente.

O projeto usa exportação estática e também pode ser hospedado em qualquer serviço que publique a pasta `out` gerada por `npm run build`.
