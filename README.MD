# Postais da Parnaíba

Um projeto autoral de memória, cultura e preservação histórica sobre a cidade de Parnaíba, desenvolvido como uma experiência digital inspirada em postais antigos, registros fotográficos, crônicas e no futuro livro **Postais da Parnaíba**.

## Sobre o Projeto

O **Postais da Parnaíba** é um site histórico-cultural criado para valorizar a memória visual da cidade por meio de:

- postais antigos;
- fotografias históricas;
- narrativas editoriais;
- crônicas sobre espaços urbanos;
- conteúdo autoral com foco em preservação cultural.

O projeto evoluiu de uma galeria estática inicial para uma plataforma de conteúdo mais completa, com páginas dedicadas a postais, landing page do livro, área sobre o autor e uma nova seção editorial chamada **Crônicas da Parnaíba**.

## Preview do Projeto

### GitHub Pages

<https://martinssallys.github.io/Postais-da-Parnaiba/>

### Preview Visual

O site apresenta uma proposta visual editorial e histórica, com:

- home com slider de destaque;
- cards de postais;
- páginas individuais para lugares e memórias da cidade;
- landing page do livro;
- seção de crônicas com estrutura preparada para evoluir futuramente com backend.

## Tecnologias Utilizadas

- `HTML5`
- `CSS3`
- `JavaScript`
- `Git`
- `GitHub Pages`

### Abordagens adotadas

- CSS modular
- componentização visual
- responsividade
- UI/UX com foco editorial
- acessibilidade básica

## Estrutura Atual do Projeto

```text
Postais-da-Parnaíba/
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── style.css
│   ├── slider.css
│   ├── responsive.css
│   ├── hero.css
│   ├── cards.css
│   ├── cronicas.css
│   ├── galeria.css
│   ├── livro.css
│   ├── postal.css
│   ├── sobre.css
│   ├── sobrehome.css
│   ├── blog.css
│   ├── header.css
│   └── footer.css
├── js/
│   ├── slider.js
│   └── script.js
├── images/
│   └── acervo visual e imagens do projeto
├── pages/
│   ├── blog.html
│   ├── cronicas.html
│   ├── galeria.html
│   ├── livro.html
│   ├── sobre.html
│   ├── post.html
│   ├── postal-antigo.html
│   ├── centro-historico.html
│   ├── porto-das-barcas.html
│   ├── mercado-publico.html
│   ├── delta-do-parnaiba.html
│   └── cronicas/
│       ├── cronica-mercado.html
│       └── cronica-centro.html
├── index.html
└── README.MD
```

## Funcionalidades Implementadas

- Slider interativo na home
- Navegação principal entre páginas
- Cards de postais na página inicial
- Página individual para cada postal
- Landing page de venda do livro
- Página sobre o autor
- Galeria de imagens históricas
- Seção editorial **Crônicas da Parnaíba**
- Página de listagem de crônicas
- Páginas individuais de crônicas
- Componente visual **Antes e Depois**
- Botões de compartilhamento nas crônicas
- Botões estilizados com referência visual de máquina de escrever
- Responsividade para desktop, tablet e mobile
- Arquitetura CSS modular com centralização de componentes
- Melhorias de acessibilidade no slider
- Links sociais com feedback visual
- Layout com identidade visual editorial e histórica

## Melhorias de UI/UX Implementadas

- hover effects mais consistentes
- transições suaves
- melhor contraste em elementos interativos
- foco visível para navegação por teclado
- slider com navegação por teclado
- componentização de cards e botões
- organização visual mais editorial
- consistência entre páginas internas
- refinamento da landing page do livro
- maior legibilidade em telas menores

## Arquitetura do Projeto

O projeto passou por uma refatoração para uma estrutura CSS mais escalável.

### CSS modular

Foram criadas três camadas principais:

- `base.css`: variáveis globais, reset, tipografia base e fundamentos visuais;
- `layout.css`: containers, grids e estruturas de layout;
- `components.css`: botões, cards, links sociais e componentes reutilizáveis.

### Entry point global

O arquivo `style.css` atua como ponto de entrada global, importando os arquivos-base da arquitetura.

### Componentização

O projeto passou a adotar uma lógica de componentes reutilizáveis, com classes como:

- `btn`
- `btn--secondary`
- `card`
- `card__media`
- `card__image`
- `card__body`
- `card__title`
- `card__description`

Isso facilita manutenção, evolução visual e futura integração com backend ou CMS.

## Responsividade

O site foi ajustado para diferentes tamanhos de tela:

- **Desktop**: layout mais amplo, com grids e imagens de destaque.
- **Tablet**: reorganização gradual de colunas e espaçamentos.
- **Mobile**: empilhamento de seções, botões maiores, textos mais legíveis e imagens adaptadas.

As media queries principais foram organizadas para:

- `1024px`
- `768px`
- `480px`

## Conteúdo Editorial e Evolução para Backend

A nova área **Crônicas da Parnaíba** já foi pensada para evolução futura com backend.

As páginas de crônica usam estrutura semântica preparada para facilitar:

- integração com CMS;
- renderização dinâmica de conteúdo;
- cadastro de autor;
- publicação de imagens;
- armazenamento em banco de dados.

Exemplos de campos já refletidos na estrutura:

- título do artigo
- autor
- data
- local
- imagem principal
- conteúdo textual
- imagens comparativas
- compartilhamento

## Roadmap / Próximas Melhorias

- Integração com backend
- Sistema de envio de crônicas pelo autor
- Galeria dinâmica com dados externos
- Integração com banco de dados
- Sistema real de compra do livro
- SEO on-page
- Otimização de performance
- Organização de conteúdo por categorias e temas
- Área administrativa para publicação futura

## Autor

**Martins Sallys**

Projeto autoral sobre história, memória e cultura de Parnaíba.

## Licença

Projeto autoral para fins educacionais e culturais.

## Observações Finais

Este projeto foi desenvolvido com foco em:

- valorização da memória local;
- identidade visual elegante e histórica;
- evolução gradual de um site estático para uma plataforma editorial;
- documentação e organização em padrão profissional para portfólio.

Se desejar, o próximo passo pode ser a criação de:

- instruções de instalação local;
- convenções de contribuição;
- seção de deploy;
- badges no topo do README.
