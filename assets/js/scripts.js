/**
 * Realiza uma chamada assíncrona para a api de Rick and Morty para receber informações sobre personagens.
 * 
 * @param {string|null} [search=null] - Texto opcional para fazer uma consulta específica à API.
 * @param {number|null} [page=null]   - Número da paginação da consulta.
 * 
 * @returns {array|null}              Em caso de sucesso retorna um array de objetos com os dados dos personagens. 
 *                                    Caso contrário, retorna null.
 */
async function getCharacters(search = null, page=null) {
    try {
        const queryParams = {
            name: search,
            page: page,
        }

        const response = await api.characters.get('/', { params: queryParams });
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
        return null;
    }
}

async function getCharacter(id) {
    if (!id) return null;
    try {
        const response = await api.characters.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
    }
}

async function getEpisode(id) {
    if (!id) return null;
    try {
        const response = await api.episodes.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
    }
}

// Renderização do Layout
/**
 * Recebe um array de objetos e retorna os dados formatados no padrão do projeto.
 * 
 * @param {array} characters    - Lista de personagens.
 * 
 * @returns {string}            String do HTML.
 */
async function renderCharacters(characters) {
    if (!Array.isArray(characters)) {
        console.error('Não array passado como argumento.');
        return null;
    }

    try {
        const html = await characters.reduce(async (htmlPromise, character) => {
            const html = await htmlPromise;

            const card = await renderCard(character);

            return html + card;
        }, Promise.resolve(''));

        return html;
    } catch (error) {
        console.error('Erro ao renderizar personagens:', error);
    }
}

async function formatLastEpisode(episodeURL) {
    const data = await getEpisode(episodeURL.split('/').slice(-1)[0]);

    return `${data.name} - ${data.episode}`;
}

/**
 * Recebe o objeto de dados de um personagem e retorna o card renderizado com os dados.
 * 
 * @param {object} character
 * 
 * @returns {string}
 */
async function renderCard(character) {
    const status = character.status == 'Dead' ? 'Morto' : character.status == 'Alive' ? 'Vivo' : 'Desconhecido';
    const lastEpisode = await formatLastEpisode(character.episode.slice(-1)[0]);

    return `
    <div class="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
        <div class="card text-light bg-transparent" data-id="${character.id}">
            <img src="${character.image}" class="card-img-top" alt="Imagem do personagem: ${character.name}">
            <div class="card-body border border-1 border-top-0 rounded-bottom-2">
                <div class="row gap-2 ">
                    <div class="col">
                        <h2 class="card-title fw-semibold fs-3">${character.name}</h2>
                        <div class="status mb-3">
                            <div class="indicator ${character.status.toLowerCase()}"></div>
                            <p class="m-0">${status} - ${character.species}</p>
                        </div>
                    </div>
                    <div class="col-12">
                        <h3 class="fs-6 fw-bold mb-1 opacity-75 ">Última localização conhecida:</h3>
                        <p class="fw-bold">${character.location.name}</p>
                    </div>
                    <div class="col-12">
                        <h3 class="fs-6 fw-bold mb-1 opacity-75 ">Visto a última vez em:</h3>
                        <p class="fw-bold">${lastEpisode}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`
}

/**
 * Recebe o valor da página e retorna o HTML do radio da paginação.
 * 
 * @param {number} id
 * 
 * @returns {string}
 */
function renderPageLink(id) {
    return `
    <li class="page-item ${id-1 == pagination.currentIndex ? 'active' : ''}" data-id="${id}" data-value="${id-1}"><a class="page-link bg-transparent fw-medium" href="${renderURLQueryParams(id)}">${id}</a></li>`;
}

/**
 * Recebe o valor da direção que a sete deve movimentar o e retorna o HTML do link.
 * 
 * @param {number} direction 1 para próxima e -1 para anterior
 * 
 * @returns {string}
 */
function renderArrowPageLink(direction) {
    return `
    <li class="page-item">
        <a class="page-link ${direction > 0 ? 'next' : 'previous'}-page fw-bold" href="" aria-label="${direction > 0 ? 'Próxima' : 'Anterior'}">
            <span aria-hidden="true">${direction > 0 ? '&raquo;' : '&laquo;'}</span>
        </a>
    </li>`
}

// Paginação
const pagination = {};
const searchInput = document.querySelector('#searchChar');

/**
 * Configura a paginação e adiciona manipuladores de eventos para navegação.
 * 
 * @param {number} currentIndex        - Índice da página atual.
 * @param {number} maxOptions          - Número máximo de opções de paginação.
 */
function setupPagination(currentIndex, maxOptions) {
    pagination.ref = document.querySelector('.pagination');
    pagination.length = null;
    pagination.maxOptions = maxOptions;
    pagination.currentIndex = currentIndex-1;

    pagination.navigation = pagination.ref;
    pagination.navigation.addEventListener('change', (e) => changePage(e.target.value));
    
    pagination.nextPage = pagination.ref.querySelector('.next-page');
    pagination.nextPage.addEventListener('click', () => nextPage());
    
    pagination.previousPage = pagination.ref.querySelector('.previous-page');
    pagination.previousPage.addEventListener('click', () => previousPage());
}

/**
 * Avança para a próxima página. Se um índice é fornecido, avança para a página especificada.
 * 
 * @param {number|null} [index=null]    - Índice opcional para avançar diretamente para uma página específica.
 */
function nextPage(index = null) {
    if (index == null) {
        index = pagination.currentIndex + 1;
    }
    pagination.currentIndex = index % pagination.length;
    updatePage();
}

/**
 * Retorna para a página anterior. Se um índice é fornecido, retorna para a página especificada.
 * 
 * @param {number|null} [index=null]    - Índice opcional para retornar diretamente para uma página específica.
 */
function previousPage(index = null) {
    if (index == null) {
        index = pagination.currentIndex - 1;
    }
    pagination.currentIndex = (pagination.length + index) % pagination.length;
    updatePage();
}

/**
 * Muda para a página especificada com base no valor fornecido.
 * 
 * @param {number} value                - Índice da página para a qual mudar.
 */
function changePage(value) {
    if (value > pagination.currentIndex) {
        nextPage(value);
        return;
    }
    if (value < pagination.currentIndex) {
        previousPage(value);
        return;
    }
}

// Ações
/**
 * Atualiza a lista de personagens com base no termo de pesquisa e na página fornecidos.
 * Realiza a atualização da URL e da visualização dos personagens.
 * 
 * @param {string|null} [search=null]    - O termo de busca para filtrar os personagens.
 * @param {number|null} [page=null]      - O número da página a ser exibida.
 * @param {boolean} [searchSubmit=false] - Indica se a atualização foi disparada por um submit de busca.
 */
async function updateCharacters(search = null, page = null, searchSubmit=false) {
    updateURL(search, page, searchSubmit);
    document.body.scrollIntoView();
    
    const characters = await getCharacters(search, page);
    const charactersDiv = document.querySelector('#characters');
    
    if (characters) {
        charactersDiv.innerHTML = await renderCharacters(characters.results);
        pagination.length = characters.info.pages;
    } else {
        charactersDiv.innerHTML = '';
        pagination.length = 0;
    }

    updatePagination();
}

/**
 * Atualiza a paginação com base no estado atual do objeto de configurações de paginação.
 */
async function updatePagination() {
    pagination.navigation.innerHTML = '';
    pagination.navigation.innerHTML += renderArrowPageLink(-1);
    
    const hideOptions = pagination.length > pagination.maxOptions;
    const maxOptions = hideOptions ? pagination.maxOptions : pagination.length;

    // Definir valor inicial da iteração
    let initialValue = 1;         // Definir em qual página começa a iteração da paginação.
    let isInitialRange = false; // Definir se ele está na faixa dos itens iniciais.
    let isFinalRange = false;   // Definir se ele está na faixa dos itens finais.
    
    if (hideOptions) {
        // Definir faixas de opções
        const initialMaxRange = pagination.length - pagination.maxOptions + 2;
        const finalMinRange = pagination.maxOptions - 1;
        
        const currentIndex = pagination.currentIndex + 1;        
        
        if (currentIndex <= finalMinRange) {
            initialValue = 1;
            isInitialRange = true;
            
        } else if (currentIndex >= initialMaxRange) {
            initialValue = initialMaxRange-1;
            isFinalRange = true;

        } else {
            initialValue = currentIndex- Math.floor(pagination.maxOptions / 2);
        }
    }
    const finalValue = initialValue + maxOptions;
    for (let i = initialValue; i < finalValue; i++) {
        if (hideOptions && i == initialValue) {
            pagination.navigation.innerHTML += renderPageLink(1);
            if (!isInitialRange) {
                pagination.navigation.innerHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
        }
        else if (hideOptions && i == finalValue - 1) {
            if (!isFinalRange) {
                pagination.navigation.innerHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
            pagination.navigation.innerHTML += renderPageLink(pagination.length);
        }
        else {
            pagination.navigation.innerHTML += renderPageLink(i);
        }
    }
    pagination.navigation.innerHTML += renderArrowPageLink(1);
    
    pagination.navigation.querySelectorAll('.page-link:not([href=""])').forEach( link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const listItem = e.target.parentNode;

            if (listItem.dataset.id - 1 != pagination.currentIndex) {
                // Remover paginação ativa atual
                listItem.parentNode.querySelector('.active').classList.remove('active');

                // Adicionar active à nova paginação
                listItem.classList.add('active');

                changePage(listItem.dataset.value);
            }            
        })
    });

    pagination.nextPage = pagination.ref.querySelector('.next-page');
    pagination.nextPage.addEventListener('click', () => nextPage());
    
    pagination.previousPage = pagination.ref.querySelector('.previous-page');
    pagination.previousPage.addEventListener('click', () => previousPage());
}

/**
 * Atualiza a página e a lista de personagens.
 * 
 * @param {string|null} [search=null]    - O termo de busca para filtrar os personagens.
 * @param {boolean} [resetPage=false]    - Indica se o índice da página deve ser reiniciado.
 * @param {boolean} [searchSubmit=false] - Indica se a atualização foi disparada por um submit de busca.
 */
async function updatePage(search=null, resetPage=false, searchSubmit=false) {
    if (resetPage) {
        pagination.currentIndex = 0;
    }

    if (!search) {
        search = searchInput.value;
    }

    await updateCharacters(search, pagination.currentIndex + 1, searchSubmit);
}

/**
 * Renderiza os parâmetros da URL para busca e paginação.
 * 
 * @param {number} page                 - O número da página atual.
 * @param {string|null} [search=null]   - O termo de busca atual.
 * 
 * @returns {string|null}               A string de consulta URL formatada ou null se a página não for definida.
 */
function renderURLQueryParams(page, search = null) {
    if (!page) return null;
    if (!search) search = searchInput.value;

    return `${window.location.pathname}?${search ? `search=${encodeURIComponent(search)}&` : ''}page=${encodeURIComponent(page)}`
}

/**
 * Atualiza a URL com os parâmetros de busca e página atuais.
 * 
 * @param {string|null} [search=null]    - O termo de busca para atualizar a URL.
 * @param {number|null} [page=null]      - O número da página para atualizar a URL.
 * @param {boolean} [searchSubmit=false] - Indica se a atualização foi disparada por um submit de busca.
 */
async function updateURL(search = null, page = null, searchSubmit=false) {
    const searchParams = await getURLInfo();

    if (search) searchParams.search = search;
    if (page) searchParams.page = page;

    const newURL = renderURLQueryParams(page, search);
    if (searchSubmit) {
        window.history.pushState({ path: newURL }, '', newURL);
    }
    window.history.replaceState({ path: newURL }, '', newURL);
}

/**
 * Define informações da API no footer da página.
 */
async function setAPIInfo() {
    api.episodes.get().then((result) => {
        document.querySelector('#episode-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de episódios no footer:', err);
    });

    api.locations.get().then((result) => {
        document.querySelector('#location-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de localizações no footer:', err);
    });

    api.characters.get().then((result) => {
        document.querySelector('#character-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de personagens no footer:', err);
        }
    );
}

/**
 * Obtém informações da URL atual, como página e termo de busca.
 * 
 * @returns {Object} Um objeto contendo informações sobre a página e o termo de busca.
 */
async function getURLInfo() {
    const searchParams = new URLSearchParams(window.location.search);

    return {
        page: searchParams.get('page') ?? 1,
        search: searchParams.get('search') ?? ''
    }
}

/**
 * Configura a página inicializando informações da API, tema e atualizando personagens e paginação.
 */
async function setupPage() {
    setAPIInfo();
    const URLInfo = await getURLInfo();

    searchInput.value = URLInfo.search;
    setupPagination(URLInfo.page, 10);
    updateCharacters(URLInfo.search, URLInfo.page);    
}

// Triggers
searchInput.addEventListener('input', (e) => {
    updatePage(e.target.value, true);
});

searchInput.form.addEventListener('submit', e => {
    e.preventDefault();
    
    updatePage(e.target.value, true, true);    
});

setupPage(); // Dispara a configuração inicial da aplicação