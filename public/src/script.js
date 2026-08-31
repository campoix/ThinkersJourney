// DEFINIÇÃO DE ESTILOS GLOBAIS

const CORES = {
    fundoEscuro:   0x050d1a,
    fundoPanel:    0x0a1628,
    fundoBotao:    0x0d2340,
    fundoBotaoHov: 0x1a3a6e,
    borda:         0x0066cc,
    ciano:         0x00d4ff,
    branco:        0xffffff,
    brancoTexto:   '#E6F4FF',
    cianoTexto:    '#00d4ff',
    cinzaTexto:    '#7090a0',
};

// ─── ESCALA RESPONSIVA ──────────────────────────────────────────────────────
// Tamanho de referência no qual o jogo foi desenhado
var REF_W = Math.round(window.innerWidth  * 0.92);
var REF_H = Math.round(window.innerHeight * 0.90);

// Retorna um tamanho de fonte em px escalado em relação à tela de referência
function scaleFontSize(basePx) {
    var scaleX = game ? game.scale.width  / REF_W : 1;
    var scaleY = game ? game.scale.height / REF_H : 1;
    var s = Math.min(scaleX, scaleY);
    
    return Math.max(10, Math.round(basePx * s)) + 'px';
}

// Retorna uma dimensão numérica escalada
function scaleDim(base) {
    if (!game) return base;
    var s = Math.min(game.scale.width / REF_W, game.scale.height / REF_H);
    return Math.round(base * s);
}
// ────────────────────────────────────────────────────────────────────────────

const estiloTitulo = (sz) => ({
    fontFamily: 'Orbitron', fontSize: sz || '42px', fontStyle: 'bold',
    color: '#00d4ff', stroke: '#003355', strokeThickness: 4,
});
const estiloMinigame = (sz) => ({
    fontFamily: 'Comic Sans MS', fontSize: sz || '48px', fontStyle: 'bold',
    color: '#00d4ff', stroke: '#003355', strokeThickness: 4,
});
const estiloBotao = (sz) => ({
    fontFamily: 'Orbitron', fontSize: sz || '20px', color: '#E6F4FF',
});
const estiloCorpo = (sz) => ({
    fontFamily: 'Orbitron', fontSize: sz || '18px', color: '#E6F4FF',
    align: 'center', lineSpacing: 8,
});

// VARIÁVEIS GLOBAIS
// ── Músicas (três trilhas distintas) ──────────────────────────────────────
let musicaAtual    = null;   // instância de som em reprodução
let musicaAtualKey = null;   // key da música em reprodução ('menu'|'terreo'|'resto')

let volumeGlobal = 0.8;

let dialogoRecepcaoConcluido  = false;
let andar1Desbloqueado        = false;
let chefe1Concluido           = false;
let chefe1PostMinigame        = false;
let minigame1Concluido        = false;
let andar2Desbloqueado        = false;
let supervisor2Concluido      = false;
let chefe2Concluido           = false;
let minigameMLConcluido       = false;
let bossDerrotado             = false;
let andar3Desbloqueado        = false;
let cutscene3AndarParte1Feita = false;
let cutscene3AndarParte2Feita = false;
let cutscene3Feita            = false;
let chefe3Concluido           = false;
let minigameFiles3Concluido   = false;
let chefe3PosConcluido        = false;
let andar4Desbloqueado        = false;
let chefe4Concluido_andar4    = false;
let minigame4Iniciado         = false;
let minigame4Concluido        = false;
let minigame4Errado           = false;
let fimDoJogo                 = false;
let supervisoraPosMinigame1   = false;
let supervisorPosBossFeito    = false;
let ultimaCutsceneFeita       = false;


// ── Gerenciamento de músicas ──────────────────────────────────────────────
// musicaKey: 'menu' | 'terreo' | 'resto'
function tocarMusica(scene, musicaKey) {
    // Nada muda se a trilha já é a correta
    if (musicaAtualKey === musicaKey && musicaAtual && musicaAtual.isPlaying) return;

    // Para a música anterior
    if (musicaAtual) {
        musicaAtual.stop();
        musicaAtual = null;
    }
    musicaAtualKey = musicaKey;

    var mapKey = {
        'menu':   'musicaResto',
        'terreo': 'musicaTerreo',
        'resto':  'musicaMenu',
    };
    var key = mapKey[musicaKey];
    if (!key) return;

    // Toca apenas se o cache tiver o áudio (evita erro se preload não ocorreu)
    if (scene.cache.audio.exists(key)) {
        musicaAtual = scene.sound.add(key, { loop: true, volume: volumeGlobal });
        musicaAtual.play();
    }
}

function abafar(ligar) {
    if (!musicaAtual) return;
    if (ligar) {
        // Efeito abafado: baixa volume e aplica lowpass simulado via volume
        musicaAtual.setVolume(volumeGlobal * 0.35);
        musicaAtual.setRate(0.90);
    } else {
        musicaAtual.setVolume(volumeGlobal);
        musicaAtual.setRate(1.0);
    }
}
// ──────────────────────────────────────────────────────────────────────────

//DIÁLOGOS(TEMA DEFINIDO)
class DialogBox {
    constructor(scene) {
        this.scene     = scene;
        this.ativo     = false;
        this.paginas   = [];
        this.pagAtual  = 0;
        this.onComplete = null;
        this.typeTimer  = null;
        this.textoCompleto = false;
        this._criarUI();
    }

    _criarUI() {
        var s  = this.scene;
        var w  = s.scale.width;
        var h  = s.scale.height;
        var bh = Math.round(h * 0.28);
        var bw = Math.round(w * 0.92);
        var bx = Math.round(w * 0.04);
        var by = Math.round(h - bh - 4);

        this.bh = bh; this.bw = bw; this.bx = bx; this.by = by;

        this.cont = s.add.container(0, 0).setScrollFactor(0).setDepth(50).setVisible(false);

        this.bgGfx = s.add.graphics();
        this._desenharPainel(false);
        this.cont.add(this.bgGfx);

        // ── nome sem "bolinha" ──────────────────────────────────────────
        this.nomeGfx = s.add.graphics();
        this.cont.add(this.nomeGfx);

        this.nomeTxt = s.add.text(bx + 20, by - 27, '', {
            fontFamily: 'Orbitron', fontSize: scaleFontSize(19), fontStyle: 'bold',
            color: '#00d4ff', stroke: '#000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(52);
        this.cont.add(this.nomeTxt);

        this.pagTxt = s.add.text(bx + bw - 12, by - 26, '', {
            fontFamily: 'Orbitron', fontSize: scaleFontSize(25), color: '#000000ff',
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(52);
        this.cont.add(this.pagTxt);

        // Texto do diálogo
        this.corpoTxt = s.add.text(bx + 22, by + 14, '', {
            fontFamily: 'Orbitron', fontSize: scaleFontSize(26), color: '#E6F4FF',
            wordWrap: { width: bw - 44 },
            lineSpacing: 7,
        }).setScrollFactor(0).setDepth(52);
        this.cont.add(this.corpoTxt);

        // Indicador [ E ] — canto inferior direito do painel
        this.hintTxt = s.add.text(bx + bw - 12, by + bh - 14, '[ E ]  Continuar ▶', {
            fontFamily: 'Orbitron', fontSize: scaleFontSize(13), color: '#00d4ff',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(52).setAlpha(0);
        this.cont.add(this.hintTxt);

        // Indicador [ E ] topo-direito
        this.skipTxt = s.add.text(bx + bw - 12, by + 3, '[ E ] pular ▶', {
            fontFamily: 'Orbitron', fontSize: scaleFontSize(22), color: '#00aacc',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(52).setAlpha(0.7);
        this.cont.add(this.skipTxt);

        this.hintTween = s.tweens.add({
            targets: this.hintTxt,
            alpha: { from: 0.2, to: 1 },
            duration: 520, yoyo: true, repeat: -1, paused: true,
        });

        this.scanGfx = s.add.graphics();
        this.scanGfx.lineStyle(1, 0x00aacc, 0.04);
        for (var yy = by + 2; yy < by + bh; yy += 4) {
            this.scanGfx.beginPath();
            this.scanGfx.moveTo(bx, yy);
            this.scanGfx.lineTo(bx + bw, yy);
            this.scanGfx.strokePath();
        }
        this.cont.add(this.scanGfx);

        this.decoGfx = s.add.graphics();
        this.decoGfx.fillStyle(CORES.ciano, 0.18);
        this.decoGfx.fillTriangle(bx, by + bh, bx + 48, by + bh, bx, by + bh - 48);
        this.cont.add(this.decoGfx);
    }

    _desenharPainel(hover) {
        var g  = this.bgGfx;
        var bx = this.bx, by = this.by, bw = this.bw, bh = this.bh;
        g.clear();
        g.fillStyle(0x000000, 0.55);
        g.fillRoundedRect(bx + 4, by + 6, bw, bh, 10);
        g.fillStyle(0x071a2a, 0.97);
        g.fillRoundedRect(bx, by, bw, bh, 10);
        g.lineStyle(2, CORES.ciano, 0.85);
        g.strokeRoundedRect(bx, by, bw, bh, 10);
        g.lineStyle(1, 0x003355, 0.6);
        g.strokeRoundedRect(bx + 3, by + 3, bw - 6, bh - 6, 8);
        g.fillStyle(0x001830, 0.6);
        g.fillRoundedRect(bx, by, bw, 36, { tl: 10, tr: 10, bl: 0, br: 0 });
        g.lineStyle(1, CORES.ciano, 0.35);
        g.beginPath(); g.moveTo(bx + 10, by + 36); g.lineTo(bx + bw - 10, by + 36); g.strokePath();
    }

    // Sem bolinha — apenas fundo/borda do nome
    _desenharNome(cor) {
        var g  = this.nomeGfx;
        var bx = this.bx, by = this.by;
        g.clear();
        var corHex = parseInt(cor.replace('#',''), 16);
        g.fillStyle(corHex, 0.15);
        g.fillRoundedRect(bx + 8, by - 28, 220, 24, 5);
        g.lineStyle(1, corHex, 0.55);
        g.strokeRoundedRect(bx + 8, by - 28, 220, 24, 5);
        // Bolinha REMOVIDA
    }

    show(paginas, onComplete) {
        this.paginas    = paginas;
        this.pagAtual   = 0;
        this.onComplete = onComplete || null;
        this.ativo      = true;
        this.cont.setVisible(true);
        this._exibirPagina(0);
    }

    _exibirPagina(idx) {
        var pag = this.paginas[idx];
        this.textoCompleto = false;

        if (this.typeTimer) { this.typeTimer.remove(false); this.typeTimer = null; }

        var cor = pag.cor || '#00d4ff';
        this._desenharNome(cor);
        this.nomeTxt.setText(pag.personagem || '').setColor(cor);
        this.pagTxt.setText((idx + 1) + ' / ' + this.paginas.length);

        this.hintTxt.setAlpha(0);
        this.hintTween.pause();

        var textoFinal = pag.texto || '';
        var chars = textoFinal.split('');
        var pos = 0;
        this.corpoTxt.setText('');
        var self = this;

        this.typeTimer = this.scene.time.addEvent({
            delay: 28,
            repeat: chars.length - 1,
            callback: function() {
                self.corpoTxt.setText(self.corpoTxt.text + chars[pos]);
                pos++;
                if (pos >= chars.length) {
                    self._mostrarHint();
                    self.textoCompleto = true;
                }
            },
        });
    }

    _mostrarHint() {
        var ultimo = this.pagAtual >= this.paginas.length - 1;
        this.hintTxt.setText(ultimo ? '[ E ]  Fechar ▶' : '[ E ]  Continuar ▶');
        this.hintTween.resume();
    }

    avancar() {
        if (!this.ativo) return;

        if (!this.textoCompleto) {
            if (this.typeTimer) { this.typeTimer.remove(false); this.typeTimer = null; }
            this.corpoTxt.setText(this.paginas[this.pagAtual].texto || '');
            this.textoCompleto = true;
            this._mostrarHint();
            return;
        }

        if (this.pagAtual < this.paginas.length - 1) {
            this.pagAtual++;
            this._exibirPagina(this.pagAtual);
        } else {
            this.fechar();
        }
    }

    fechar() {
        this.ativo = false;
        this.cont.setVisible(false);
        this.hintTween.pause();
        if (this.typeTimer) { this.typeTimer.remove(false); this.typeTimer = null; }
        if (this.onComplete) this.onComplete();
    }

    destroy() {
        if (this.typeTimer) this.typeTimer.remove(false);
        this.cont.destroy();
    }
}


const DIALOGOS = {
    // GameScene — Recepção
    recepcao: [
        {
            personagem: 'RECEPCIONISTA',
            cor: '#00d4ff',
            texto: '\nBom dia, bem-vinda a Thinkers, somos uma empresa especializada em desenvolver soluções em IA, buscando sempre trazer essa tecnologia de um modo criativo e interessante.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nOlá, bom dia, sou a nova estagiária da empresa.'
        },
        {
            personagem: 'RECEPCIONISTA',
            cor: '#00d4ff',
            texto: '\nQue legal! Parabéns por conquistar sua vaga aqui na Thinkers. Conosco você aprenderá bastante sobre o uso de inteligências artificiais, suas aplicações práticas e como seu funcionamento impacta a sociedade. E o melhor é que, desempenhando suas atividades, você terá a incrível oportunidade de alavancar sua carreira como profissional em IA na Thinkers!'
        },
    ],

    // PrimeiroAndarScene — fala do Chefe inicial
    chefe1: [
        {
            personagem: 'CHEFE',
            cor: '#00d4ff',
            texto: '\nFeliz primeiro dia aqui na Thinkers, Ana! Sou o Diretor do departamento de IA, local onde você iniciará sua jornada. Nesse primeiro momento, você receberá as instruções necessárias para iniciar seu trabalho de organização de tarefas. Seu setor fica logo adiante, e a nossa supervisora ensinará mais sobre os conteúdos necessários para trabalhar como novo membro da nossa equipe.'
        },
    ],

    supervisora: [
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nOlá, Ana! Sou responsável pelas atividades aqui no primeiro andar. Aqui você começará entendendo o que são as inteligências artificiais e como elas funcionam como ferramentas no nosso dia a dia. Vamos começar?'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nAs inteligências artificiais são tecnologias que possibilitam a análise de padrões em grandes quantidades de dados, realizando algumas atividades que usualmente exigiriam análise humana. São ferramentas poderosas, porém somos nós os grandes protagonistas para o seu uso eficiente.'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nSabia que as IAs já estão amplamente difundidas no cotidiano? Elas estão nos aplicativos que recomendam filmes ou músicas, no mapa que sugere a melhor rota, no e-mail identificado como spam ou na rede social que sugere conteúdos do seu interesse.'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nAs IAs são especialmente eficientes quando precisamos:\n1. Analisar grandes volumes de informação.\n2. Encontrar padrões complexos.\n3. Realizar tarefas repetitivas.\n4. Trabalhar com alta velocidade.'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nMas nós continuamos sendo insubstituíveis em áreas como:'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\n1. Criatividade.\n2. Empatia.\n3. Julgamento ético.\n4. Tomada de decisões em contextos complexos.\n5. Compreensão de nuances sociais.'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nCompreendido? Maravilha! Agora vá até sua bancada para organizar algumas pastas que estão fora do lugar. Lá você começará seu trabalho aqui na Thinkers!'
        },
    ],

    // Supervisora após minigame 1 completado
    supervisoraPosMinigame: [
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nBom trabalho! Você organizou todas as pastas corretamente. Fica claro que você já entendeu bem a diferença entre o que uma IA faz com eficiência e o que depende da capacidade humana. Continue assim!'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nObrigada! Aprendi muito com essa atividade. Estou pronta para o próximo desafio!'
        },
        {
            personagem: 'SUPERVISORA',
            cor: '#00d4ff',
            texto: '\nFale com o Chefe, ele está esperando por você. Parabéns novamente pelo excelente desempenho!'
        },
    ],

    // PrimeiroAndarScene — fala do Chefe após minigame 1
    chefe1PosMinigame: [
        {
            personagem: 'CHEFE',
            cor: '#00d4ff',
            texto: '\nExcelente trabalho no minigame! Você provou que entende a diferença entre IA e humanos. O 2º Andar está liberado! Dirija-se ao elevador para continuar sua jornada.'
        },
    ],

    // SegundoAndarScene — supervisor aborda ao entrar (pré-boss)
    andar2PreBoss: [
        {
            personagem: 'SUPERVISOR',
            cor: '#00d4ff',
            texto: '\nNosso sistema foi infectado por um vírus terrível. Precisamos da sua ajuda para treinar nossa IA de defesa!'
        },
        {
            personagem: 'SUPERVISOR',
            cor: '#00d4ff',
            texto: '\nMas antes, você precisa classificar os dados de treinamento. Vá até o computador e comece o processo de Machine Learning.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nEntendido! Vou ao computador agora. Deixa comigo!'
        },
    ],

    // SegundoAndarScene — supervisor puxado após boss derrotado
    andar2PosBoss: [
        {
            personagem: 'SUPERVISOR',
            cor: '#00d4ff',
            texto: '\nIncrível! Você treinou a IA com maestria e derrotou o vírus boss! Essa foi a ameaça mais grave que já enfrentamos.'
        },
        {
            personagem: 'SUPERVISOR',
            cor: '#00d4ff',
            texto: '\nCom o vírus eliminado, o 3º Andar foi desbloqueado. A missão final aguarda você lá em cima!'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nNão vou parar agora! Vou ao 3º Andar resolver isso de vez.'
        },
    ],

    // TerceiroAndarScene — supervisor do 3º andar (pós boss, nasce na mesa do supervisor pixel 1660)
    andar3Pos: [
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nO THK.BOT está muito mais consistente!'
        },
        {
            personagem: 'TELEFONE',
            cor: '#00d4ff',
            texto: '\nRiiing!...Riiing!...Riiing!'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nSetor de treinamento do THK.BOT...Certo!...Agora mesmo!'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nEra uma ligação do chefe! Ele me mandou transferi-la para o quarto andar.'
        },
    ],

// cutscene3Andar - falas antes do zoom out
    cutscene3AndarParte1: [
        {
            personagem: 'THK.BOT',
            cor: '#00d4ff',
            texto: '\nOlá! Eu sou o THK.BOT, um agente de IA projetado para auxiliar nossos analistas com classificações e decisões, além de armazenar e organizar informações importantes para a empresa.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nOi, THK.BOT! Sou nova aqui e gostaria de entender o que esse setor faz. Você pode me explicar?'
        },
        {
            personagem: 'THK.BOT',
            cor: '#00d4ff',
            texto: '\nEsse andar é onde treinamos e re-treinamos os modelos de IA da empresa. A principal tarefa dos funcionários aqui é separar bananas de parafusos.'
                    },
    ],

    // cutscene3Andar - falas após o zoom out
    cutscene3AndarParte2: [
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nComo você pode ver, o THK.BOT ainda está em desenvolvimento e precisa de muitos dados de treinamento para melhorar suas respostas.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nSua tarefa é "alimentar" o THK.BOT com dados de qualidade, além de identificar seus significados para garantir uma maior coerência nas respostas.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nEntendi! Vou começar a organizar os dados de treinamento para o THK.BOT. Tenho certeza de que, com o tempo, ele se tornará um assistente muito mais eficiente e confiável!'
        },
    ],

    // TerceiroAndarScene — sequência quando fala com o assistente após a cutscene.
    andar3: [
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nAntes de começarmos, é importante que você compreenda alguns conceitos fundamentais sobre o funcionamento das IAs, especialmente do THK.BOT, para que possa realizar um trabalho de qualidade aqui no 3º andar.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nVocê já ouviu falar em Deep Learning?'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nJá ouvi falar, mas gostaria de aprender a fundo o assunto.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nÓtimo! Deep Learning é uma área do aprendizado de máquina que usa redes neurais artificiais com muitas camadas. Semelhante aos neurônios humanos.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nA máquina utiliza centenas de dados e cada camada da rede aprende a identificar padrões cada vez mais complexos:\n1 - As primeiras camadas reconhecem coisas simples — bordas, cores, palavras.\n2 - As camadas intermediárias combinam esses padrões em estruturas maiores.\n3 - As camadas finais tomam decisões com base em tudo que foi aprendido.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nA quantidade de dados fornecidos aumenta a precisão da máquina, o problema é quando os dados são de baixa qualidade ou inconsistentes, que é o caso do THK.BOT.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nAgora, sobre Agentes de IA: capacidades de:\n1 - Perceber o ambiente ao seu redor — dados, sensores, entradas do usuário.\n2 - Planejar ações com base em um objetivo.\n3 - Executar essas ações de forma autônoma.\n4 - Aprender com os resultados e ajustar seu comportamento.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nÉ como a diferença entre uma calculadora e um estagiário bem treinado — a calculadora só responde; o estagiário pensa, age e aprende.'
        },
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nNossa missão aqui no terceiro andar é justamente essa: coletar os dados de treinamento corretos, identificar onde o aprendizado do THK.BOT falhou, e iniciar o processo de re-treinamento.'
        },
    ],

    

    // Pós-4º andar (antigo andar3Pos reutilizado para desbloqueio do 4º)
    andar4Desbloqueio: [
        {
            personagem: 'ASSISTENTE',
            cor: '#00d4ff',
            texto: '\nFantástico! Você limpou todos os arquivos maliciosos. O 4º Andar — nosso laboratório de IA avançada — está agora desbloqueado para você!'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nObrigada! Estou curiosa para conhecer o laboratório. Vou subir agora!'
        },
    ],

    // QuartoAndarScene — chefe do 4º andar
    chefe4Andar: [
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nBem-vinda ao Comitê de Ética, Ana! As suas habilidades nos outros setores provaram que você é uma profissional competente e está apta para assumir responsabilidades maiores.'
        },
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nSua última missão é analisar os relatórios recebidos e julgar se as ações dos nossos colaboradores são éticas. Vá ao computador!'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nPode deixar! Meu julgamento será justo e imparcial.'
        },
    ],

    // QuartoAndarScene - após errar o minigame
    chefe4AndarErro: [
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nO Thk.bot analisou que alguns dos relatórios podem ter sido mal interpretados, revise-os.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nCerto chefe! Não irei decepcionar.'
        }
    ],

    // QuartoAndarScene - fim do jogo
    chefe4AndarFim: [
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nMuito obrigada pelo seu trabalho. O expediente está prestes a acabar e é hora de voltar para casa.'
        },
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nEspero te ver amanhã para que você possa aprender ainda mais sobre a Thinkers e seu trabalho com IA'
        },
        {
            personagem: 'COORDENADORA-CHEFE',
            cor: '#00d4ff',
            texto: '\nBoa noite.'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nBoa noite, Chefe! Estou ansiosa para minhas próximas tarefas.'
        }
    ],

    cutscene4Andar: [
    {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nBom dia, Chefe! Novo dia aqui na empresa, tudo bem com você?'
        }, 
        {
            personagem: 'CHEFE',
            cor: '#00d4ff',
            texto: '\nBom dia, Ana, tudo sim! Gostaria de dar meus parabéns! Você demonstrou muita habilidade em todos os desafios apresentados. Com certeza, você é um dos maiores talentos da Thinkers!'
        },
        {
            personagem: 'VOCÊ',
            cor: '#00ff88',
            texto: '\nMuito obrigada chefe! Qual o motivo de eu ter sido chamada para sua sala hoje?'
        },
        {
            personagem: 'CHEFE',
            cor: '#00d4ff',
            texto: '\nComo reconhecimento do seu talento e esforço, você comandará um novo setor de inteligências artificias na nossa empresa. Aguarde as próximas instruções, sua jornada está apenas começando...'
                    },
    ]
};

// USER INTERFACE

function criarBotao(scene, x, y, texto, callback, largura, altura) {
    largura = largura || 300;
    altura  = altura  || 52;
    var cont = scene.add.container(x, y);
    var bg   = scene.add.graphics();

    function desenhar(cor, brd) {
        bg.clear();
        bg.fillStyle(cor, 1);
        bg.fillRoundedRect(-largura/2, -altura/2, largura, altura, 10);
        bg.lineStyle(1.5, brd, 0.9);
        bg.strokeRoundedRect(-largura/2, -altura/2, largura, altura, 10);
    }
    desenhar(CORES.fundoBotao, CORES.borda);

    var label = scene.add.text(0, 0, texto, estiloBotao(scaleFontSize(19))).setOrigin(0.5);
    var zona  = scene.add.zone(0, 0, largura, altura).setInteractive({ useHandCursor: true });
    cont.add([bg, label, zona]);

    zona.on('pointerover',  function() { desenhar(CORES.fundoBotaoHov, CORES.ciano); label.setColor('#00d4ff'); scene.tweens.add({ targets: cont, scaleX: 1.04, scaleY: 1.04, duration: 100 }); });
    zona.on('pointerout',   function() { desenhar(CORES.fundoBotao,    CORES.borda); label.setColor('#E6F4FF'); scene.tweens.add({ targets: cont, scaleX: 1,    scaleY: 1,    duration: 100 }); });
    zona.on('pointerdown',  function() { scene.tweens.add({ targets: cont, scaleX: 0.96, scaleY: 0.96, duration: 70 }); });
    zona.on('pointerup',    function() { scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 70, onComplete: callback }); });
    return cont;
}

function linhaDecorativa(scene, x, y, larg) {
    larg = larg || 200;
    var g = scene.add.graphics();
    g.lineStyle(1, CORES.ciano, 0.5);
    g.beginPath(); g.moveTo(x - larg/2, y); g.lineTo(x + larg/2, y); g.strokePath();
    return g;
}

function criarFundoCena(scene) {
    var w = scene.scale.width, h = scene.scale.height;
    scene.add.rectangle(w/2, h/2, w, h, CORES.fundoEscuro);
    var sl = scene.add.graphics();
    sl.lineStyle(1, 0x002244, 0.12);
    for (var yy = 0; yy < h; yy += 20) {
        sl.beginPath(); sl.moveTo(0, yy); sl.lineTo(w, yy); sl.strokePath();
    }
}

function notif(scene, msg, cor) {
    cor = cor || '#00ff88';
    var w = scene.scale.width, h = scene.scale.height;
    var t = scene.add.text(w/2, h * 0.18, msg, {
        fontFamily: 'Orbitron', fontSize: scaleFontSize(17), color: cor,
        stroke: '#000', strokeThickness: 4,
        backgroundColor: '#000000bb', padding: { x: 14, y: 7 },
        align: 'center', wordWrap: { width: w * 0.72 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    scene.tweens.add({ targets: t, alpha: 1, duration: 280, hold: 2800, yoyo: true, onComplete: function() { t.destroy(); } });
}

// SETUP DO MUNDO
function setupMundo(scene, keyImagem, alturaFator) {
    alturaFator = alturaFator || 1.0;
    var w = scene.scale.width, h = scene.scale.height;
    var IMG_W = 2560, IMG_H = 640;

    var escalaPorLarg = w / IMG_W;
    var alturaAlvo    = h * alturaFator;
    var escalaPorAlt  = alturaAlvo / IMG_H;
    var escala        = Math.max(escalaPorLarg, escalaPorAlt);
    var worldWidth    = IMG_W * escala;
    var imagemAltura  = IMG_H * escala;
    var chaoY         = h - imagemAltura;

    scene.add.rectangle(worldWidth/2, h/2, worldWidth, h, 0x060e1c).setDepth(0);

    if (chaoY > 0) {
        var sky = scene.add.graphics().setDepth(1);
        sky.fillGradientStyle(0x0a1628, 0x0a1628, 0x060e1c, 0x060e1c, 1);
        sky.fillRect(0, 0, worldWidth, chaoY);
        sky.fillStyle(0x4499cc, 0.35);
        for (var i = 0; i < 55; i++) {
            var sx = (i * 139.3) % worldWidth;
            var sy = (i * 77.7)  % (chaoY - 8);
            sky.fillCircle(sx, sy, i % 3 === 0 ? 1.5 : 1);
        }
        sky.lineStyle(2, CORES.ciano, 0.28);
        sky.beginPath(); sky.moveTo(0, chaoY); sky.lineTo(worldWidth, chaoY); sky.strokePath();
    }

    scene.add.image(0, chaoY, keyImagem).setOrigin(0, 0).setScale(escala).setDepth(2);

    return { worldWidth: worldWidth, escala: escala, chaoY: chaoY };
}

// PLAYER SETUP
function setupPlayer(scene, startX, worldWidth, height, chaoY) {
    var areaJogo   = height - chaoY;
    var altPlayer  = areaJogo * 0.82;
    var pScale     = altPlayer / 2500;

    var player = scene.physics.add.sprite(startX, height - 5, 'player');
    player.setScale(pScale);
    player.setCollideWorldBounds(true);
    player.setGravityY(1500);
    player.setSize(380, 1650);
    player.setOffset(380, 290);
    player.setDepth(10);

    var chaoRect = scene.add.rectangle(worldWidth / 2, height - 1, worldWidth, 2).setAlpha(0);
    scene.physics.add.existing(chaoRect, true);
    scene.physics.add.collider(player, chaoRect);

    return player;
}

function setupAnims(scene) {
    if (!scene.anims.exists('walk')) {
        scene.anims.create({
            key: 'walk',
            frames: scene.anims.generateFrameNumbers('player', { start: 1, end: 8 }),
            frameRate: 10, repeat: -1,
        });
    }
    if (!scene.anims.exists('idle')) {
        scene.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 1,
        });
    }
}

function moverPlayer(scene) {
    var speed = 700;
    if (scene.cursors.left.isDown  || scene.keys.A.isDown) {
        scene.player.setVelocityX(-speed);
        scene.player.anims.play('walk', true);
        scene.player.setFlipX(true);
    } else if (scene.cursors.right.isDown || scene.keys.D.isDown) {
        scene.player.setVelocityX(speed);
        scene.player.anims.play('walk', true);
        scene.player.setFlipX(false);
    } else {
        scene.player.setVelocityX(0);
        scene.player.anims.play('idle', true);
    }
    if ((scene.cursors.up.isDown || scene.keys.W.isDown) && scene.player.body.blocked.down) {
        scene.player.setVelocityY(-520);
    }
}

function criarIndE(scene, texto, yFator) {
    yFator = yFator || 0.46;
    var w = scene.scale.width, h = scene.scale.height;
    return scene.add.text(w/2, h * yFator, texto, {
        fontFamily: 'Orbitron', fontSize: scaleFontSize(17), color: '#00ffcc',
        stroke: '#000', strokeThickness: 4,
        backgroundColor: '#00000077', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(30);
}

// Textura da sobreposição ESC.
var TEXTURE_ID_ANA = 'idana_terreo';

function obterTexturaIdAtual() {
    if (andar4Desbloqueado) {
        return 'idana_quarto';
    } else if (andar3Desbloqueado) {
        return 'idana_terceiro';
    } else if (andar2Desbloqueado) {
        return 'idana_segundo';
    } else if (dialogoRecepcaoConcluido) {
        return 'idana_primeiro';
    } else {
        return 'idana_terreo';
    }
}


// Pressionar ESC mostra e oculta imagem ID-ANA em tela cheia. Além de pausar e despausar a física.
function toggleIdAnaOverlay(scene) {
    if (scene.dlgBox && scene.dlgBox.ativo) return false;

    let texturaId = obterTexturaIdAtual();

    if (scene.idAnaOverlay) {
        if (scene.configBtn) scene.configBtn.destroy();
        scene.idAnaOverlay.destroy();
        scene.idAnaOverlay = null;
        
        if (scene.physics && scene.physics.world) scene.physics.world.resume();
        scene.pausando = false;
        return true;
    }

    scene.pausando = true;
    if (scene.physics && scene.physics.world) scene.physics.world.pause();
    
    if (scene.player && scene.player.body) {
        scene.player.setVelocity(0, 0);
        if (scene.player.anims) scene.player.anims.play('idle', true);
    }

    var w = scene.scale.width, h = scene.scale.height;
    var img = scene.add.image(w / 2, h / 2, texturaId);
    img.setScrollFactor(0).setDepth(200);
    
    var sc = Math.min(w / img.width, h / img.height);
    img.setScale(sc);
    scene.idAnaOverlay = img;

    // Engrenagem da imagem do crachá leva até as configurações
    
    var zonaW = 350 * sc;
    var zonaH = 350 * sc;

    var gearX = (w / 2) - (img.width * sc / 2) + (zonaW / 2);

    var gearY = (h / 2) - (img.height * sc / 2) + (250 * sc) + (zonaH / 2);

    scene.configBtn = scene.add.zone(gearX, gearY, zonaW, zonaH)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201)
        .setInteractive({ useHandCursor: true });

    scene.configBtn.on('pointerdown', function() {
        scene.registry.set('lastActiveScene', scene.scene.key);
        
        scene.pausando = false; 
        if (scene.physics && scene.physics.world) scene.physics.world.resume();

        if (scene.configBtn) scene.configBtn.destroy();
        if (scene.idAnaOverlay) scene.idAnaOverlay.destroy();
        scene.idAnaOverlay = null;

        scene.scene.start('ConfigScene'); 

        
    });

        // Seta vermelha da imagem do crachá leva até o menu.


    scene.returnBtn = scene.add.zone(gearX + 725, gearY, zonaW + 725, zonaH)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201)
        .setInteractive({ useHandCursor: true });

    scene.returnBtn.on('pointerdown', function() {
        scene.registry.set('lastActiveScene', scene.scene.key);
        
        scene.pausando = false; 
        if (scene.physics && scene.physics.world) scene.physics.world.resume();

        if (scene.returnBtn) scene.returnBtn.destroy();
        if (scene.idAnaOverlay) scene.idAnaOverlay.destroy();
        scene.idAnaOverlay = null;

        scene.scene.start('MenuScene'); 

        
    });

    return true;
}

function desenharMonitor(scene, mx, my, mw, mh) {
    var bm = scene.add.graphics();
    bm.fillStyle(0x1e2d44, 1); bm.fillRoundedRect(mx-18, my-26, mw+36, mh+52, 14);
    bm.fillStyle(0x08111e, 1); bm.fillRoundedRect(mx, my, mw, mh, 8);
    bm.lineStyle(2, CORES.ciano, 0.7); bm.strokeRoundedRect(mx, my, mw, mh, 8);
    bm.fillStyle(0x0d1f38, 1); bm.fillRect(mx, my, mw, 30);
    bm.fillStyle(0x1e2d44, 1);
    bm.fillRect(scene.scale.width/2-55, my+mh+4, 110, 14);
    bm.fillRect(scene.scale.width/2-85, my+mh+18, 170, 10);
    bm.fillStyle(CORES.ciano, 0.8); bm.fillCircle(scene.scale.width/2, my+mh+11, 4);
    [0xff5f57, 0xffbd2e, 0x28c840].forEach(function(c, i) {
        var g = scene.add.graphics(); g.fillStyle(c, 1); g.fillCircle(mx+mw-20-i*20, my+15, 5);
    });
    return bm;
}


// MENU PRINCIPAL
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    preload() {
        this.load.image('bg',  './assets/cenario_desfocado_menu.png');
        this.load.image('logo', 'assets/refe.png');
        this.load.image('idana_terreo', './assets/idana_terreo.png');
        this.load.image('idana_primeiro', './assets/idana_primeiro.png');
        this.load.image('idana_segundo', './assets/idana_segundo.png');
        this.load.image('idana_terceiro', './assets/idana_terceiro.png');
        this.load.image('idana_quarto', './assets/idana_quarto.png');
        this.load.audio('musicaMenu',  './assets/musicamenu.mp3');
        this.load.audio('musicaTerreo', './assets/musicaterreo.mp3');
        this.load.audio('musicaResto',  './assets/musicaresto.mp3');
    }

    create() {
        var w = this.scale.width, h = this.scale.height;

        tocarMusica(this, 'menu');

        this.add.image(w/2, h/2, 'bg').setDisplaySize(w, h).setAlpha(0.7);

        var logo = this.add.image(w/2, h*0.22, 'logo').setAlpha(0);
        var logoScale = Math.min(w / 1280, h / 720);
        logo.setScale(logoScale);
        this.tweens.add({ targets: logo, alpha: 1, duration: 700, ease: 'Power2' });

        linhaDecorativa(this, w/2, h*0.38, 260);

        var scene = this; 

        var botoesInfo = [
            { 
                // Agora o botão jogar continua a gameplay de onde parou.
                label: 'JOGAR', 
                fn: function() { 
                    let ultimaCena = scene.registry.get('lastActiveScene');
                    if (ultimaCena) {
                        scene.scene.start(ultimaCena);
                    } else {
                        scene.scene.start('IntroScene'); 
                    }
                } 
            },
            { label: 'CONFIGURAÇÕES', fn: function() { scene.scene.start('ConfigScene'); } },
            { label: 'TUTORIAL',      fn: function() { scene.scene.start('TutorialScene'); } },
            { label: 'CRÉDITOS',      fn: function() { scene.scene.start('CreditsScene'); } },
        ];

        botoesInfo.forEach(function(info, i) {
            var btn = criarBotao(scene, w/2, h*0.47 + i*68, info.label, info.fn, 280);
            
            btn.setAlpha(0);
            scene.tweens.add({ 
                targets: btn, 
                alpha: 1, 
                delay: 350 + i*90, 
                duration: 380
            });
        });
    }
}

// CONFIGURAÇÕES
class ConfigScene extends Phaser.Scene {
    constructor() { super({ key: 'ConfigScene' }); }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Mantém música do menu
        tocarMusica(this, 'menu');
        criarFundoCena(this);
        var pg=this.add.graphics();
        var pts=[];
        for(var i=0;i<28;i++) pts.push({x:Phaser.Math.Between(0,w),y:Phaser.Math.Between(0,h),r:Phaser.Math.FloatBetween(0.6,2),s:Phaser.Math.FloatBetween(0.1,0.4),a:Phaser.Math.FloatBetween(0.1,0.55)});
        this.events.on('update',function(){pg.clear();pts.forEach(function(p){p.y-=p.s;if(p.y<-4)p.y=h+4;pg.fillStyle(CORES.ciano,p.a);pg.fillCircle(p.x,p.y,p.r);});});

        this.add.text(w/2, h*0.15, 'CONFIGURAÇÕES', estiloTitulo(scaleFontSize(55))).setOrigin(0.5);
        linhaDecorativa(this, w/2, h*0.190, 300);
        this.add.text(w/2, h*0.32, 'VOLUME DA MÚSICA', estiloCorpo(scaleFontSize(25))).setOrigin(0.5);

        var tx = w/2-150, ty = h*0.43, tw = 300;
        var bgTrilha = this.add.graphics();
        bgTrilha.fillStyle(0x0a1e38, 1); bgTrilha.fillRoundedRect(tx, ty-4, tw, 8, 4);

        var fill = this.add.graphics();
        var scene = this;
        function drawFill(v) { fill.clear(); fill.fillStyle(CORES.ciano, 1); fill.fillRoundedRect(tx, ty-4, v*tw, 8, 4); }
        drawFill(volumeGlobal);

        var thumb = this.add.graphics();
        function drawThumb(x) { thumb.clear(); thumb.lineStyle(2,CORES.ciano,1); thumb.strokeCircle(x,ty,12); thumb.fillStyle(CORES.ciano,1); thumb.fillCircle(x,ty,6); }
        drawThumb(tx + volumeGlobal*tw);

        var zona = this.add.rectangle(tx + volumeGlobal*tw, ty, 28, 28).setInteractive({ draggable: true });
        this.input.setDraggable(zona);
        var lbl = this.add.text(w/2, h*0.52, Math.round(volumeGlobal*100)+'%', { fontFamily:'Orbitron', fontSize:scaleFontSize(24), color:'#00d4ff' }).setOrigin(0.5);

        zona.on('drag', function(_, dragX) {
            dragX = Phaser.Math.Clamp(dragX, tx, tx+tw);
            zona.x = dragX; volumeGlobal = (dragX-tx)/tw;
            drawFill(volumeGlobal); drawThumb(dragX);
            lbl.setText(Math.round(volumeGlobal*100)+'%');
            if (musicaAtual) musicaAtual.setVolume(volumeGlobal);
        });

        // Volta no andar que estava.
        criarBotao(this, w/2, h*0.73, 'VOLTAR', function() {
          let ultimaCena = scene.registry.get('lastActiveScene');
    
          if (ultimaCena) {
              scene.scene.start(ultimaCena);
          } else {
              scene.scene.start('MenuScene');
          }
      }, 200);
        
    }
}

// TUTORIAL
class TutorialScene extends Phaser.Scene {
    constructor() { super({ key: 'TutorialScene' }); }
    init(data) { this.fromPause = data && data.fromPause; }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Mantém música do menu
        tocarMusica(this, 'menu');
        criarFundoCena(this);
        var pg=this.add.graphics();
        var pts=[];
        for(var i=0;i<28;i++) pts.push({x:Phaser.Math.Between(0,w),y:Phaser.Math.Between(0,h),r:Phaser.Math.FloatBetween(0.6,2),s:Phaser.Math.FloatBetween(0.1,0.4),a:Phaser.Math.FloatBetween(0.1,0.55)});
        this.events.on('update',function(){pg.clear();pts.forEach(function(p){p.y-=p.s;if(p.y<-4)p.y=h+4;pg.fillStyle(CORES.ciano,p.a);pg.fillCircle(p.x,p.y,p.r);});});

        this.add.text(w/2, h*0.12, 'TUTORIAL', estiloTitulo(scaleFontSize(55))).setOrigin(0.5);
        linhaDecorativa(this, w/2, h*0.160, 180);

        var controles = [
            { k:'W',   d:'Pular'          },
            { k:'A',   d:'Mover esquerda' },
            { k:'D',   d:'Mover direita'  },
            { k:'E',   d:'Interagir'      },
            { k:'ESC', d:'Menu de Pause'  },
        ];
        var cy = h * 0.30;
        controles.forEach(function(c) {
            var g = this.add.graphics();
            g.fillStyle(CORES.fundoPanel, 0.9); g.fillRoundedRect(w/2-160, cy-20, 320, 40, 8);
            g.lineStyle(1, CORES.borda, 0.4);    g.strokeRoundedRect(w/2-160, cy-20, 320, 40, 8);
            g.fillStyle(CORES.fundoBotao, 1);    g.fillRoundedRect(w/2-148, cy-14, 52, 28, 6);
            g.lineStyle(1, CORES.ciano, 0.7);    g.strokeRoundedRect(w/2-148, cy-14, 52, 28, 6);
            this.add.text(w/2-122, cy, c.k, { fontFamily:'Orbitron', fontSize:scaleFontSize(23), fontStyle:'bold', color:'#00d4ff' }).setOrigin(0.5);
            this.add.text(w/2-88,  cy, c.d, { fontFamily:'Orbitron', fontSize:scaleFontSize(24), color:'#E6F4FF' }).setOrigin(0, 0.5);
            cy += 54;
        }, this);

        var scene = this;
        criarBotao(this, w/2, h*0.87, 'VOLTAR', function() {
            if (scene.fromPause || scene.registry.get('fromPause')) {
                scene.registry.set('fromPause', false);
                scene.scene.stop(); scene.scene.launch('PauseScene');
            } else {
                scene.scene.start('MenuScene');
            }
        }, 200);
    }
}


// INTRO
class IntroScene extends Phaser.Scene {
    constructor() { super({ key: 'IntroScene' }); }
    preload() { this.load.video('intro', './assets/video1.mp4'); }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Para a música durante o vídeo
        if (musicaAtual && musicaAtual.isPlaying) musicaAtual.stop();

        var video = this.add.video(w/2, h/2, 'intro').setDisplaySize(w, h);
        video.play();

        this.add.text(w/2, h*0.93, 'ESPAÇO para pular', { fontFamily:'Orbitron', fontSize:scaleFontSize(25), color:'#171a23ff', fontStyle: "bold" }).setOrigin(0.5);

        var scene = this;
        video.on('complete', function() { scene.scene.start('GameScene'); });
        this.input.keyboard.once('keydown-SPACE', function() { video.stop(); scene.scene.start('GameScene'); });
        this.input.once('pointerdown', function() { video.play(); });
    }
}

// TÉRREO
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    preload() {
        this.load.image('cenario',  './assets/cenario_game1.jpeg');
        this.load.spritesheet('player', './assets/Sprite-0001-Sheet2.png', { frameWidth: 1140, frameHeight: 1940 });
    }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Música do térreo
        tocarMusica(this, 'terreo');

        var mundo = setupMundo(this, 'cenario', 1.0);
        this.worldWidth = mundo.worldWidth;
        this.escala     = mundo.escala;
        this.chaoY      = mundo.chaoY;

        this.physics.world.setBounds(0, 0, this.worldWidth, h);
        this.player = setupPlayer(this, 180, this.worldWidth, h, this.chaoY);
        setupAnims(this);

        this.cameras.main.setBounds(0, 0, this.worldWidth, h);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keys     = this.input.keyboard.addKeys('W,A,S,D');
        this.keyE     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.pausando    = false;
        this.transitando = false;

        this.zonaRec  = { x1: 1500  * this.escala, x2: 1800 * this.escala };
        this.zonaElev = { x1: 2180 * this.escala, x2: 2520 * this.escala };

        this.dlgBox = new DialogBox(this);
        this.dlgIniciou = false;

        this.indElev = criarIndE(this, '[ E ] Usar Elevador', 0.44);

        this.hintBlq = this.add.text(w/2, h*0.34, '⚠  Fale com a recepcionista primeiro!', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(15), color:'#ff5555',
            stroke:'#000', strokeThickness:4, backgroundColor:'#000000aa', padding:{x:14,y:7},
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);
        this.hintBlqAtivo = false;

        if (!dialogoRecepcaoConcluido) {
            this.barreira = this.add.rectangle(this.zonaRec.x2 + 16, h/2, 32, h*2);
            this.physics.add.existing(this.barreira, true);
            this.collBarreira = this.physics.add.collider(this.player, this.barreira);
        }
    }

    iniciarDialogo() {
        if (this.dlgIniciou) return;
        this.dlgIniciou = true;
        this.player.setVelocityX(0);
        this.player.anims.play('idle', true);
        var scene = this;
        this.dlgBox.show(DIALOGOS.recepcao, function() {
            if (!dialogoRecepcaoConcluido) {
                dialogoRecepcaoConcluido = true;
                andar1Desbloqueado = true;
                if (scene.collBarreira) { scene.collBarreira.destroy(); scene.collBarreira = null; }
                if (scene.barreira)     { scene.barreira.destroy();     scene.barreira    = null; }
            }
        });
    }

    irElevador() {
        if (this.transitando) return;
        this.transitando = true;
        this.player.setVelocityX(0);
        this.cameras.main.fadeOut(600, 0, 0, 0);
        var scene = this;
        this.cameras.main.once('camerafadeoutcomplete', function() { scene.scene.start('ElevatorScene'); });
    }

    update() {
        if (this.transitando) return;

        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (toggleIdAnaOverlay(this)) return;
        }
        if (this.idAnaOverlay) return;

        if (this.dlgBox.ativo) {
            this.player.setVelocityX(0);
            this.player.anims.play('idle', true);
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.dlgBox.avancar();
            return;
        }

        moverPlayer(this);

        var px = this.player.x;
        var naRec  = px >= this.zonaRec.x1  && px <= this.zonaRec.x2;
        var naElev = px >= this.zonaElev.x1 && px <= this.zonaElev.x2;

        if (naRec && !dialogoRecepcaoConcluido && !this.dlgIniciou) {
            this.iniciarDialogo();
        }

        if (naElev) {
            if (!dialogoRecepcaoConcluido) {
                this.indElev.setAlpha(0);
                if (!this.hintBlqAtivo) {
                    this.hintBlqAtivo = true;
                    var scene = this;
                    this.tweens.add({ targets: this.hintBlq, alpha: 1, duration: 250, hold: 2200, yoyo: true,
                        onComplete: function() { scene.hintBlq.setAlpha(0); scene.hintBlqAtivo = false; } });
                }
            } else {
                this.indElev.setAlpha(1);
                if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.irElevador();
            }
        } else {
            this.indElev.setAlpha(0);
        }
    }
}

// ELEVADOR
class ElevatorScene extends Phaser.Scene {
    constructor() { super({ key: 'ElevatorScene' }); }

    preload() { this.load.image('cenarioElev', './assets/Elevas.webp'); }

    create() {
        var w = this.scale.width, h = this.scale.height;
        criarFundoCena(this);
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ── Efeito abafado enquanto está no elevador ──────────────────
        abafar(true);

        // Quando sair do elevador, retira o efeito
        var scene = this;
        this.events.once('shutdown', function() { abafar(false); });

        if (this.textures.exists('cenarioElev')) {
            this.add.image(w/2, h/2, 'cenarioElev').setDisplaySize(w, h).setAlpha(0.35);
        }
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.50);

        this.add.text(w/2, h*0.16, '⬆ ELEVADOR', estiloTitulo(scaleFontSize(30))).setOrigin(0.5);
        linhaDecorativa(this, w/2, h*0.24, 220);
        this.add.text(w/2, h*0.30, 'Selecione o andar', estiloCorpo(scaleFontSize(14))).setOrigin(0.5);

        var andares = [
            { label: '4º ANDAR',            cena: 'QuartoAndarScene',    ok: andar4Desbloqueado       },
            { label: '3º ANDAR',            cena: 'TerceiroAndarScene',  ok: andar3Desbloqueado       },
            { label: '2º ANDAR',            cena: 'SegundoAndarScene',   ok: andar2Desbloqueado       },
            { label: '1º ANDAR',            cena: 'PrimeiroAndarScene',  ok: dialogoRecepcaoConcluido },
            { label: 'TÉRREO  (Recepção)',  cena: 'GameScene',           ok: true                    },
        ];

        andares.forEach(function(a, i) {
            var y = h * 0.38 + i * 64;
            if (a.ok) {
                var cenaAlvo = a.cena;
                var btn = criarBotao(this, w/2, y, a.label, function() { this.scene.start(cenaAlvo); }.bind(this), 320);
                btn.setAlpha(0);
                this.tweens.add({ targets: btn, alpha: 1, delay: 250 + i*90, duration: 350 });
            } else {
                var g = this.add.graphics();
                g.fillStyle(CORES.fundoBotao, 0.30); g.fillRoundedRect(w/2-160, y-26, 320, 52, 10);
                g.lineStyle(1.5, 0x334455, 0.4);    g.strokeRoundedRect(w/2-160, y-26, 320, 52, 10);
                this.add.text(w/2, y, a.label + '  🔒', { fontFamily:'Orbitron', fontSize:scaleFontSize(17), color:'#7090a0' }).setOrigin(0.5);
            }
        }, this);
    }
}

// PRIMEIRO ANDAR
class PrimeiroAndarScene extends Phaser.Scene {
    constructor() { super({ key: 'PrimeiroAndarScene' }); }

    init(data) {
        this.spawnNaPC = data && data.spawnNaPC ? true : false;
    }

    preload() {
        this.load.image('cenario1', './assets/segundo_andar_fundo_cenario.jpeg');
        this.load.spritesheet('player', './assets/Sprite-0001-Sheet2.png', { frameWidth: 1140, frameHeight: 1940 });
    }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Música do resto (andares 1-4)
        tocarMusica(this, 'resto');

        var mundo = setupMundo(this, 'cenario1', 1.0);
        this.physics.world.setBounds(0, 0, mundo.worldWidth, h);

        var e = mundo.escala, cy = mundo.chaoY;
        this.zonaChefe = { x1: 1250*e, x2: 1690*e };
        this.zonaSup   = { x1: 1850*e, x2: 2180*e };
        this.zonaElev  = { x1: 20*e,   x2: 310*e  };

        var startX = this.spawnNaPC ? (this.zonaSup.x1 + 80) : 200;
        this.player = setupPlayer(this, startX, mundo.worldWidth, h, mundo.chaoY);

        setupAnims(this);
        this.cameras.main.setBounds(0, 0, mundo.worldWidth, h);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keys     = this.input.keyboard.addKeys('W,A,S,D');
        this.keyE     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pausando    = false;
        this.transitando = false;

        this.dlgBox = new DialogBox(this);

        this.indChefe = criarIndE(this, '[ E ] Falar com Chefe',         0.44);
        this.indSup   = criarIndE(this, '[ E ] Falar com a Supervisora', 0.44);
        this.indElev  = criarIndE(this, '[ E ] Elevador',                0.44);

        this.add.text(1300*e, cy-28, '▼ CHEFE',      { fontFamily:'Orbitron', fontSize:scaleFontSize(13), color:'#00d4ff' }).setOrigin(0.5).setDepth(5);
        this.add.text(2000*e, cy-28, '▼ SUPERVISOR', { fontFamily:'Orbitron', fontSize:scaleFontSize(13), color:'#ffcc00' }).setOrigin(0.5).setDepth(5);

        // Se voltou do minigame e supervisora pós-minigame ainda não foi feito, inicia automaticamente
        if (this.spawnNaPC && minigame1Concluido && !supervisoraPosMinigame1) {
            var scene = this;
            this.time.delayedCall(400, function() {
                scene.dlgBox.show(DIALOGOS.supervisoraPosMinigame, function() {
                    supervisoraPosMinigame1 = true;
                });
            });
        }
    }

    iniciarDialogoChefe() {
        if (this.dlgBox.ativo) return;
        this.player.setVelocityX(0); this.player.anims.play('idle', true);
        var scene = this;

        if (minigame1Concluido && !chefe1PostMinigame) {
            this.dlgBox.show(DIALOGOS.chefe1PosMinigame, function() {
                chefe1PostMinigame   = true;
                andar2Desbloqueado   = true;
                notif(scene, '🏆 2º Andar desbloqueado! Vá ao elevador.', '#00ff88');
            });
        } else if (!chefe1Concluido) {
            this.dlgBox.show(DIALOGOS.chefe1, function() {
                chefe1Concluido = true;
                notif(scene, '✔ Fale com a Supervisora para começar a missão!', '#00d4ff');
            });
        }
    }

    irMinigame() {
        if (!chefe1Concluido) {
            notif(this, '⚠ Fale com o Chefe primeiro!', '#ff5555');
            return;
        }
        if (this.dlgBox.ativo) return;
        this.player.setVelocityX(0);
        this.player.anims.play('idle', true);
        var scene = this;

        if (minigame1Concluido && supervisoraPosMinigame1) {
            notif(this, '✔ Você já completou a missão deste andar!', '#00d4ff');
            return;
        }

        this.dlgBox.show(DIALOGOS.supervisora, function() {
            scene.transitando = true;
            scene.cameras.main.fadeOut(400, 0, 0, 0);
            scene.cameras.main.once('camerafadeoutcomplete', function() {
                scene.scene.start('MinigameDragDrop1Scene');
            });
        });
    }

    irElevador() {
        if (this.transitando) return;
        this.transitando = true;
        var scene = this;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', function() { scene.scene.start('ElevatorScene'); });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (toggleIdAnaOverlay(this)) return;
        }
        if (this.idAnaOverlay) return;

        if (this.dlgBox.ativo) {
            this.player.setVelocityX(0); this.player.anims.play('idle', true);
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.dlgBox.avancar();
            return;
        }
        moverPlayer(this);
        var px = this.player.x;
        var naChefe = px >= this.zonaChefe.x1 && px <= this.zonaChefe.x2;
        var naSup   = px >= this.zonaSup.x1   && px <= this.zonaSup.x2;
        var naElev  = px >= this.zonaElev.x1  && px <= this.zonaElev.x2;

        var chefeDisponivel = (!chefe1Concluido) || (minigame1Concluido && supervisoraPosMinigame1 && !chefe1PostMinigame);

        if (naChefe && chefeDisponivel && !this.dlgBox.ativo) {
            this.iniciarDialogoChefe();
        }

        this.indChefe.setAlpha(0);
        this.indSup.setAlpha(naSup ? 1 : 0);
        this.indElev.setAlpha(naElev ? 1 : 0);

        if (naSup  && Phaser.Input.Keyboard.JustDown(this.keyE)) this.irMinigame();
        if (naElev && Phaser.Input.Keyboard.JustDown(this.keyE)) this.irElevador();
    }
}

// MINIGAME PRIMEIRO ANDAR — drag & drop
class MinigameDragDrop1Scene extends Phaser.Scene {
    constructor() { super({ key: 'MinigameDragDrop1Scene' }); }

    create() {
        var w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, 0x080e18);

        var mx = w*0.03, my = h*0.03, mw = w*0.94, mh = h*0.94;
        desenharMonitor(this, mx, my, mw, mh);
        this.add.text(mx+12, my+7, '◉  ThinkerOS — Análise de Eficiência', { fontFamily:'Orbitron', fontSize:scaleFontSize(13), color:'#00d4ff' });

        this.add.text(w/2, my+50, 'QUEM É MAIS EFICIENTE?', estiloMinigame(scaleFontSize(26))).setOrigin(0.5);
        this.add.text(w/2, my+76, 'Arraste cada tarefa para a coluna correta',
            { fontFamily:'Comic Sans MS', fontSize:scaleFontSize(16), color:'#7090a0' }).setOrigin(0.5);

        var colY = my+96, colH = mh-136, colW = mw*0.28;
        var cIAx = mx+mw*0.17, cHumx = mx+mw*0.83;

        var scene = this;
        function drawCol(cx, titulo, corHex) {
            var g = scene.add.graphics();
            g.fillStyle(0x0c1c30, 0.9); g.fillRoundedRect(cx-colW/2, colY, colW, colH, 8);
            g.lineStyle(2, corHex, 0.6); g.strokeRoundedRect(cx-colW/2, colY, colW, colH, 8);
            scene.add.text(cx, colY-30, titulo, {
                fontFamily:'Comic Sans MS', fontSize:scaleFontSize(23), fontStyle:'bold',
                color:'#'+corHex.toString(16).padStart(6,'0'), align:'center', wordWrap:{width:colW}
            }).setOrigin(0.5);
        }
        drawCol(cIAx,  '🤖 IA É MAIS\nEFICIENTE',       0x00d4ff);
        drawCol(cHumx, '🧠 HUMANO É MAIS\nEFICIENTE',   0xffcc00);
        this.zonaIA  = { x:cIAx,  y:colY, w:colW, h:colH };
        this.zonaHum = { x:cHumx, y:colY, w:colW, h:colH };

        var dados = [
            { t:'Categorizar milhares\nde imagens de gatinhos',   ia:true  },
            { t:'Hospital cruzar dados\nde exames de uma cidade', ia:true  },
            { t:'Banco detectar\ncomportamentos suspeitos',       ia:true  },
            { t:'Rotas econômicas\npara uma empresa',             ia:true  },
            { t:'Criar estratégia\nde marketing',                 ia:true },
            { t:'Resolver problema\nmatemático em aberto',        ia:false },
            { t:'Avaliar impacto\nsocial de nova tecnologia',     ia:false },
            { t:'Decisão em crise\nempresarial',                  ia:false },
        ];

        var cw=w*0.16, ch=h*0.10, sx=mx+mw*0.33, sy=colY+8;
        this.cards = []; this.resp = {};

        var idxArr = Phaser.Utils.Array.Shuffle([0,1,2,3,4,5,6,7]);
        idxArr.forEach(function(idx, i) {
            var d  = dados[idx];
            var cx = sx + (i%2)*(cw+w*0.01) + cw/2;
            var cy = sy + Math.floor(i/2)*(ch+h*0.015) + ch/2;

            var cont = scene.add.container(cx, cy).setDepth(10);
            var bg   = scene.add.graphics();
            function makeDraw(bgRef) {
                return function(fill, brd) {
                    bgRef.clear();
                    bgRef.fillStyle(fill, 1); bgRef.fillRoundedRect(-cw/2,-ch/2,cw,ch,9);
                    bgRef.lineStyle(2, brd, 0.9); bgRef.strokeRoundedRect(-cw/2,-ch/2,cw,ch,9);
                };
            }
            var drawBg = makeDraw(bg);
            drawBg(CORES.fundoBotao, CORES.borda);

            var txt = scene.add.text(0, 0, d.t, {
            fontFamily:'Orbitron', fontSize:scaleFontSize(18), color:'#E6F4FF',
            align:'center', wordWrap:{width:cw-16}, letterSpacing: 6
            }).setOrigin(0.5);

            cont.add([bg, txt]);
            cont.setSize(cw, ch).setInteractive({ draggable:true });
            scene.input.setDraggable(cont);
            cont._ia     = d.ia;
            cont._idx    = idx;
            cont._drawBg = drawBg;
            cont._sx     = cx; cont._sy = cy;
            scene.resp[idx] = null;
            scene.cards.push(cont);
        });

        this.input.on('drag', function(_, o, dx, dy) { o.x=dx; o.y=dy; o.setDepth(25); });
        this.input.on('dragend', function(_, o) {
            o.setDepth(10);
            function inZ(z) { return o.x>=z.x-z.w/2 && o.x<=z.x+z.w/2 && o.y>=z.y && o.y<=z.y+z.h; }
            if      (inZ(scene.zonaIA))  scene.resp[o._idx] = 'ia';
            else if (inZ(scene.zonaHum)) scene.resp[o._idx] = 'hum';
            else                          scene.resp[o._idx] = null;
        });

        criarBotao(this, w/2, my+mh-26, 'SALVAR RESPOSTAS', function() { scene.validar(); }, 260, 42);
    }

    validar() {
        var todos = true, erros = 0, scene = this;
        this.cards.forEach(function(c) {
            var r = scene.resp[c._idx];
            if (r === null) { todos = false; return; }
            var ok = (r==='ia' && c._ia) || (r==='hum' && !c._ia);
            if (!ok) erros++;
            c._drawBg(ok ? 0x003322 : 0x330000, ok ? 0x00ff88 : 0xff4444);
        });
        if (!todos) { notif(this, '⚠ Arraste todos os cards antes de salvar!', '#ffcc00'); return; }
        if (erros > 0) {
            notif(this, '✗ ' + erros + ' erro(s). Cards vermelhos precisam ser corrigidos!', '#ff4444');
            return;
        }
        minigame1Concluido = true;
        this.mostrarParabens();
    }

    mostrarParabens() {
        var w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.76).setDepth(60);
        var p = this.add.graphics().setDepth(61);
        p.fillStyle(CORES.fundoPanel, 0.97); p.fillRoundedRect(w/2-255, h/2-125, 510, 260, 14);
        p.lineStyle(2, CORES.ciano, 0.8);    p.strokeRoundedRect(w/2-255, h/2-125, 510, 260, 14);
        this.add.text(w/2, h/2-78, '🎉 PARABÉNS!', estiloTitulo(scaleFontSize(28))).setOrigin(0.5).setDepth(62);
        this.add.text(w/2, h/2-28,
            'Missão completa! Volte ao 1º Andar —\na Supervisora tem um recado para você.',
            { fontFamily:'Orbitron', fontSize:scaleFontSize(14), color:'#E6F4FF', align:'center', lineSpacing:7 }
        ).setOrigin(0.5).setDepth(62);
        criarBotao(this, w/2, h/2+74, 'VOLTAR AO 1º ANDAR', function() {
            this.scene.start('PrimeiroAndarScene', { spawnNaPC: true });
        }.bind(this), 280, 44).setDepth(63);
    }
}
// SEGUNDO ANDAR
class SegundoAndarScene extends Phaser.Scene {
    constructor() { super({ key: 'SegundoAndarScene' }); }
    init(data) {
        this.spawnNaPC  = data && data.spawnNaPC  ? true : false;
        // fromBoss: nasce na área do supervisor após derrotar o boss
        this.fromBoss   = data && data.fromBoss   ? true : false;
    }

    preload() {
        this.load.image('cenario_AndarCaos', './assets/segundoAndarPreBoss.png');
        this.load.image('cenario4', './assets/segundoAndarSafe.jpeg');
        this.load.spritesheet('player', './assets/Sprite-0001-Sheet2.png', { frameWidth: 1140, frameHeight: 1940 });
        this.load.image('supervisor2', './assets/supervisor2.png');
    }

    create() {
        var w = this.scale.width, h = this.scale.height;
        // Música do resto (andares 1-4)
        tocarMusica(this, 'resto');

        var keyCen = bossDerrotado ? 'cenario4' : 'cenario_AndarCaos';
        var mundo  = setupMundo(this, keyCen, 1.0);
        this.physics.world.setBounds(0, 0, mundo.worldWidth, h);

        var e = mundo.escala, cy = mundo.chaoY;
        this.zonaChefe = { x1:2150*e, x2:2380*e };
        this.zonaPC    = { x1:1450*e, x2:1750*e };
        this.zonaElev  = { x1:20*e,   x2:310*e  };
        this.zonaSup   = { x1:280*e,  x2:480*e  };

        var supervisorImg = this.add.image(450*e, h * 0.679, 'supervisor2').setDepth(10).setFlipX(true).setScale(0.21*e);
        supervisorImg.setVisible(!bossDerrotado);

        // ── Spawn: se veio do boss, nasce na mesa do supervisor ──────
        var startX;
        if (this.fromBoss) {
            startX = this.zonaSup.x1 + 2030*e;
        } else if (this.spawnNaPC) {
            startX = this.zonaPC.x1 + 80*e;
        } else {
            startX = 200;
        }

        this.player = setupPlayer(this, startX, mundo.worldWidth, h, mundo.chaoY);
        setupAnims(this);
        this.cameras.main.setBounds(0, 0, mundo.worldWidth, h);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keys     = this.input.keyboard.addKeys('W,A,S,D');
        this.keyE     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pausando = false; this.transitando = false;

        this.dlgBox = new DialogBox(this);

        this.indChefe = criarIndE(this, '[ E ] Falar com Supervisor', 0.44);
        this.indPC    = criarIndE(this, '[ E ] Usar Computador', 0.44);
        this.indElev  = criarIndE(this, '[ E ] Elevador',        0.44);

        if (!bossDerrotado) {
            this.indChefe.setVisible(false);
        } else {
            this.indChefe.setVisible(true);
        }

        this.add.text(1300*e, cy-28, '▼ SUPERVISOR',  { fontFamily:'Orbitron', fontSize:scaleFontSize(13), color:'#00d4ff' }).setOrigin(0.5).setDepth(5);
        this.add.text(2000*e, cy-28, '▼ COMPUTADOR',  { fontFamily:'Orbitron', fontSize:scaleFontSize(13), color:'#aaffff' }).setOrigin(0.5).setDepth(5);

        // ── Se veio do boss, puxa o diálogo do supervisor automaticamente ──
        if (this.fromBoss && bossDerrotado && !supervisorPosBossFeito) {
            var scene = this;
            this.time.delayedCall(600, function() {
                if (!scene.dlgBox.ativo) {
                    scene.player.setVelocityX(0);
                    scene.player.anims.play('idle', true);
                    scene.dlgBox.show(DIALOGOS.andar2PosBoss, function() {
                        supervisorPosBossFeito = true;
                        andar3Desbloqueado     = true;
                        notif(scene, '🏆 3º Andar desbloqueado! Vá ao elevador.', '#00ff88');
                    });
                }
            });
        }
    }

    iniciarDialogoSupervisor() {
        if (this.dlgBox.ativo) return;
        this.player.setVelocityX(0); this.player.anims.play('idle', true);
        var scene = this;
        this.dlgBox.show(DIALOGOS.andar2PreBoss, function() {
            chefe2Concluido      = true;
            supervisor2Concluido = true;
            notif(scene, '💻 Vá ao Computador para sua nova missão!', '#00d4ff');
        });
    }

    iniciarDialogoChefe() {
        if (chefe2Concluido || this.dlgBox.ativo) return;
        this.player.setVelocityX(0); this.player.anims.play('idle', true);
        var scene = this;
        var seqDlg = bossDerrotado ? DIALOGOS.andar2PosBoss : DIALOGOS.andar2PreBoss;
        this.dlgBox.show(seqDlg, function() {
            chefe2Concluido = true;
            if (bossDerrotado) {
                andar3Desbloqueado = true;
                notif(scene, '🏆 3º Andar desbloqueado! Vá ao elevador.', '#00ff88');
            } else {
                notif(scene, '💻 Vá ao Computador para sua nova missão!', '#00d4ff');
            }
        });
    }

    usarPC() {
        if (!chefe2Concluido) { notif(this,'⚠ Fale com o Supervisor antes!','#ff5555'); return; }
        if (bossDerrotado)    { notif(this,'✔ Missão deste andar concluída.','#00d4ff'); return; }
        this.transitando = true;
        var scene = this;
        this.cameras.main.fadeOut(400,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', function() { scene.scene.start('MinigameMLScene'); });
    }

    irElevador() {
        if (this.transitando) return;
        this.transitando = true;
        var scene = this;
        this.cameras.main.fadeOut(500,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', function() { scene.scene.start('ElevatorScene'); });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (toggleIdAnaOverlay(this)) return;
        }
        if (this.idAnaOverlay) return;

        if (this.dlgBox.ativo) {
            this.player.setVelocityX(0); this.player.anims.play('idle',true);
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.dlgBox.avancar();
            return;
        }
        moverPlayer(this);
        var px = this.player.x;
        var naChefe = px>=this.zonaChefe.x1 && px<=this.zonaChefe.x2;
        var naPC    = px>=this.zonaPC.x1    && px<=this.zonaPC.x2;
        var naElev  = px>=this.zonaElev.x1  && px<=this.zonaElev.x2;
        var naSup   = px>=this.zonaSup.x1   && px<=this.zonaSup.x2;

        this.indChefe.setAlpha(!chefe2Concluido && naChefe ? 1 : 0);
        this.indPC.setAlpha(naPC ? 1 : 0);
        this.indElev.setAlpha(naElev ? 1 : 0);

        if (naSup && !supervisor2Concluido && !bossDerrotado) this.iniciarDialogoSupervisor();
        if (naChefe && !chefe2Concluido && Phaser.Input.Keyboard.JustDown(this.keyE)) this.iniciarDialogoChefe();
        if (naPC    && Phaser.Input.Keyboard.JustDown(this.keyE)) this.usarPC();
        if (naElev  && Phaser.Input.Keyboard.JustDown(this.keyE)) this.irElevador();
    }
}


// MINIGAME SEGUNDO ANDAR — ML
class MinigameMLScene extends Phaser.Scene {
    constructor() { super({ key: 'MinigameMLScene' }); }

    create() {
        var w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w/2,h/2,w,h,0x080e18);
        var mx=w*0.03,my=h*0.03,mw=w*0.94,mh=h*0.94;
        desenharMonitor(this,mx,my,mw,mh);
        this.add.text(mx+12,my+7,'◉  ThinkerOS — Treinamento de IA',{fontFamily:'Orbitron',fontSize:scaleFontSize(13),color:'#00d4ff'});

        this.add.text(w/2,my+48,'MACHINE LEARNING | WAT.X',estiloMinigame(scaleFontSize(26))).setOrigin(0.5);
        this.add.text(w/2,my+74,'Arraste dados para ajudar o sistema do Wax.X a reconhecer padrões',
            {fontFamily:'Comic Sans MS',fontSize:scaleFontSize(16),color:'#7090a0'}).setOrigin(0.5);

        var colY=my+96,colH=mh-136,colW=mw*0.28;
        var cBomX=mx+mw*0.17,cMalX=mx+mw*0.83;
        var scene=this;

        function drawCol(cx,t,c){
            var g=scene.add.graphics();
            g.fillStyle(0x0c1c30,0.9);g.fillRoundedRect(cx-colW/2,colY,colW,colH,8);
            g.lineStyle(2,c,0.6);g.strokeRoundedRect(cx-colW/2,colY,colW,colH,8);
            scene.add.text(cx,colY-30,t,{fontFamily:'Comic Sans MS',fontSize:scaleFontSize(24),fontStyle:'bold',
                color:'#'+c.toString(16).padStart(6,'0'),align:'center',wordWrap:{width:colW}}).setOrigin(0.5);
        }
        drawCol(cBomX,'CONCEITOS NÃO\nRELACIONADOS A VÍRUS',0x00d4ff);
        drawCol(cMalX,'CONCEITOS\nRELACIONADOS A VÍRUS',0xffcc00);
        this.zonaBom={x:cBomX,y:colY,w:colW,h:colH};
        this.zonaMal={x:cMalX,y:colY,w:colW,h:colH};

        var dados=[
            {t:'Marketing',                         v:false,d:'Estratégias éticas para promover produtos e serviços.'},
            {t:'Finanças',                           v:false,d:'Gestão de dinheiro, investimentos e análise financeira.'},
            {t:'Criação de textos',                  v:false,d:'Produção de conteúdo textual para fins comunicativos.'},
            {t:'Malware',                            v:true, d:'⚠ Software malicioso que causa danos a sistemas.'},
            {t:'Spyware',                            v:true, d:'⚠ Programa que espiona o usuário sem consentimento.'},
            {t:'Segurança digital\n(vulnerabilidades)',v:true,d:'⚠ Dados sobre vulnerabilidades usados pelo vírus para explorar falhas no sistema.'},
        ];

        var cw=w*0.16, ch=h*0.10, sx=mx+mw*0.33, sy=colY+8;
        this.cardsML=[]; this.respML={};

        this.tip=this.add.text(0,0,'',{fontFamily:'Orbitron',fontSize:scaleFontSize(13),color:'#ffffcc',
            backgroundColor:'#001122ee',padding:{x:10,y:6},wordWrap:{width:260}}).setDepth(55).setVisible(false);

        var idxArr=Phaser.Utils.Array.Shuffle([0,1,2,3,4,5]);
        idxArr.forEach(function(idx,i){
            var d=dados[idx];
            var cx=sx+(i%2)*(cw+w*0.01)+cw/2, cy=sy+Math.floor(i/2)*(ch+h*0.015)+ch/2;
            var cont=scene.add.container(cx,cy).setDepth(10);
            var bg=scene.add.graphics();
            function makeDraw(b){return function(f,brd){b.clear();b.fillStyle(f,1);b.fillRoundedRect(-cw/2,-ch/2,cw,ch,9);b.lineStyle(2,brd,0.9);b.strokeRoundedRect(-cw/2,-ch/2,cw,ch,9);};} 
            var drawBg=makeDraw(bg);
            drawBg(CORES.fundoBotao,CORES.borda);
            var txt=scene.add.text(0,0,d.t,{fontFamily:'Orbitron',fontSize:scaleFontSize(18),color:'#E6F4FF',align:'center',fontStyle:'bold',wordWrap:{width:cw-16}, letterSpacing:6}).setOrigin(0.5);
            cont.add([bg,txt]);
            cont.setSize(cw,ch).setInteractive({draggable:true});
            scene.input.setDraggable(cont);
            cont._v=d.v;cont._idx=idx;cont._drawBg=drawBg;cont._sx=cx;cont._sy=cy;cont._def=d.d;
            scene.respML[idx]=null;scene.cardsML.push(cont);
            var def=d.d;
            cont.on('pointerover',function(ptr){
                scene.tip.setText(def).setPosition(ptr.worldX+14,ptr.worldY-34).setVisible(true);
            });
            cont.on('pointerout',function(){scene.tip.setVisible(false);});
            cont.on('pointermove',function(ptr){scene.tip.setPosition(ptr.worldX+14,ptr.worldY-34);});
        });

        this.input.on('drag',function(_,o,dx,dy){o.x=dx;o.y=dy;o.setDepth(25);scene.tip.setVisible(false);});
        this.input.on('dragend',function(_,o){
            o.setDepth(10);
            function inZ(z){return o.x>=z.x-z.w/2&&o.x<=z.x+z.w/2&&o.y>=z.y&&o.y<=z.y+z.h;}
            if(inZ(scene.zonaBom))scene.respML[o._idx]='bom';
            else if(inZ(scene.zonaMal))scene.respML[o._idx]='mal';
            else scene.respML[o._idx]=null;
        });

        criarBotao(this,w/2,my+mh-26,'SALVAR RESPOSTAS',function(){scene.validarML();},260,42);
    }

    validarML(){
        var todos=true,erros=0,scene=this;
        this.cardsML.forEach(function(c){
            var r=scene.respML[c._idx];
            if(r===null){todos=false;return;}
            var ok=(r==='mal'&&c._v)||(r==='bom'&&!c._v);
            if(!ok)erros++;
            c._drawBg(ok?0x003322:0x330000,ok?0x00ff88:0xff4444);
        });
        if(!todos){notif(this,'⚠ Categorize todos os cards!','#ffcc00');return;}
        if(erros>0){
            notif(this,'✗ '+erros+' erro(s). Cards vermelhos precisam ser corrigidos!','#ff4444');
            return;
        }
        minigameMLConcluido=true;
        var sc=this;
        this.cameras.main.fadeOut(400,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',function(){sc.scene.start('MinigameBossScene');});
    }
}

// BATALHA BOSS SEGUNDO ANDAR
// ── O boss executa trajetórias em arco (paraboloide bidimensional):
//      Eixo X → MU  (velocidade constante)
//      Eixo Y → MUV (velocidade inicial nula, aceleração constante)
// ── Função animarBoss(xi, yi, xf, yf, T, elemento) implementada
//    sem usar funções de animação da biblioteca Phaser.
class MinigameBossScene extends Phaser.Scene {
    constructor() { super({ key: 'MinigameBossScene' }); }

    preload() {
        this.load.spritesheet('player','./assets/Sprite-0001-Sheet2.png', { frameWidth: 1140, frameHeight: 1940 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // animarBoss — Movimentação bidimensional por cinemática
    //
    // Parâmetros de entrada:
    //   xi, yi  — posição inicial do elemento gráfico (px)
    //   xf, yf  — posição final  do elemento gráfico (px)
    //   T       — duração total da animação (segundos)
    //   elem    — referência ao elemento gráfico (Phaser Container)
    //
    // Modelagem:
    //   Eixo X — MU  : vx = (xf−xi)/T        x(t) = xi + vx·t
    //   Eixo Y — MUV : ay = 2·(yf−yi)/T²     vy(t) = ay·t       y(t) = yi + ½·ay·t²
    //
    // A função inicializa os parâmetros cinemáticos e seta
    // this._anim para ser consumido frame a frame no update().
    // ─────────────────────────────────────────────────────────────────────────
    animarBoss(xi, yi, xf, yf, T, elem) {
        var dx = xf - xi;          // deslocamento total em x
        var dy = yf - yi;          // deslocamento total em y

        // ── MU (eixo X) ──────────────────────────────────────────────────
        // Velocidade constante: vx = Δx / T
        var vx = dx / T;

        // ── MUV (eixo Y) — velocidade inicial nula ───────────────────────
        // Equação cinemática: yf = yi + ½·ay·T²  → ay = 2·Δy / T²
        var ay = (2 * dy) / (T * T);

        this._anim = {
            xi: xi, yi: yi,      // posição inicial
            xf: xf, yf: yf,      // posição final
            T:  T,               // duração total (s)
            t:  0,               // cronômetro acumulado (s)
            vx: vx,              // velocidade MU (px/s)
            ay: ay,              // aceleração MUV (px/s²)
            elem: elem,          // referência ao elemento
            done: false,         // flag de conclusão
        };

        console.log('=== animarBoss INÍCIO ===');
        console.log('Parâmetros: xi='+xi+' yi='+yi+' xf='+xf+' yf='+yf+' T='+T+'s');
        console.log('MU  (eixo X): vx = '+vx.toFixed(3)+' px/s');
        console.log('MUV (eixo Y): ay = '+ay.toFixed(3)+' px/s²');
    }

    create() {
        var w=this.scale.width, h=this.scale.height;

        this._desenharFundoMaquina(w, h);

        var chaoY = h * 0.68;
        this.physics.world.setBounds(0, 0, w, h);

        // ── Player ────────────────────────────────────────────────────────
        var player = this.physics.add.sprite(180, h - 5, 'player');
        var areaJogo = h - chaoY;
        var pScale = (areaJogo * 0.82) / 2500;
        player.setScale(pScale);
        player.setCollideWorldBounds(true);
        player.setGravityY(1500);
        player.setSize(380, 1650);
        player.setOffset(380, 290);
        player.setDepth(10);
        player.setTint(0x88ddff);

        var chaoRect = this.add.rectangle(w/2, h-1, w, 2).setAlpha(0);
        this.physics.add.existing(chaoRect, true);
        this.physics.add.collider(player, chaoRect);
        this.player = player;

        setupAnims(this);
        this.cameras.main.setBounds(0, 0, w, h);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.cursors=this.input.keyboard.createCursorKeys();
        this.keys=this.input.keyboard.addKeys('W,A,S,D');
        this.keyE=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.transitando=false;

        this.bossVida=10; this.bossMaxVida=10;

        // ── Boss container e posição inicial ──────────────────────────────
        // O boss parte de (80, chaoY−80) e executará arcos de trajetória
        this.bossX = 80;
        this.bossY = chaoY - 80;
        this.chaoY = chaoY;

        this.bossGfxCont = this.add.container(this.bossX, this.bossY).setDepth(8);
        this._desenharBoss(1.0);

        this.bossTxtLabel = this.add.text(this.bossX, this.bossY-130,'☣ VÍRUS BOSS',{
            fontFamily:'Orbitron', fontSize:scaleFontSize(22), color:'#ff4444',
            stroke:'#000', strokeThickness:5
        }).setOrigin(0.5).setDepth(9);

        // ── Barra de vida ─────────────────────────────────────────────────
        this.baraBg   = this.add.graphics().setScrollFactor(0).setDepth(20);
        this.baraFill = this.add.graphics().setScrollFactor(0).setDepth(21);
        this.baraTxt  = this.add.text(w/2, 54,'',{
            fontFamily:'Orbitron', fontSize:scaleFontSize(20), color:'#ff8888',
            stroke:'#000', strokeThickness:4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(22);
        this.baraTitulo = this.add.text(w/2, 16,'☣  VÍRUS BOSS', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(18), fontStyle:'bold', color:'#ff4444',
            stroke:'#000', strokeThickness:4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(22);
        this.atualizarBara();

        this.indAtaque = criarIndE(this,'[ E ] ATACAR', 0.44);
        this.indAtaque.setColor('#ff4444').setFontSize(scaleFontSize(20));

        this._iniciarParticulasGlitch(w, h);

        // ── Flash de dano periódico ───────────────────────────────────────
        var scene=this;
        this.time.addEvent({delay:2500, loop:true, callback:function(){
            if(scene.transitando) return;
            var fl=scene.add.rectangle(w/2,h/2,w,h,0xff0000,0.12).setScrollFactor(0).setDepth(60);
            scene.tweens.add({targets:fl, alpha:0, duration:280, onComplete:function(){fl.destroy();}});
        }});

        this.raioAtaque = 180;

        // ── Iniciar primeiro arco do boss ─────────────────────────────────
        // Trajetória: ponto atual → ponto oposto, com subida no Y
        this._proximoArco();
    }

    // ── Calcula e dispara o próximo arco do boss ──────────────────────────
    // O boss alterna entre lado esquerdo e direito da tela.
    // O ápice Y (ponto mais alto da trajetória) é randomizado para variedade.
    _proximoArco() {
        var w  = this.scale.width;
        var xi = this.bossX;
        var yi = this.bossY;

        // Destino alterna entre extremos esquerdo/direito
        var xf = (xi < w / 2) ? (w - 100) : 100;

        // O boss "sobe" até um ponto intermediário e desce de volta ao nível do chão
        // Para isso, dividimos em DOIS semi-arcos consecutivos (subida e descida).
        // Semi-arco de subida: yi → ápice
        // Semi-arco de descida: ápice → yf (= yi, nível do chão)
        var apiceY  = this.chaoY * 0.20 + Math.random() * (this.chaoY * 0.25); // altura do ápice
        var xMeio   = (xi + xf) / 2;          // meio horizontal
        var T_subida = 1.4;                    // duração de cada semi-arco (segundos)

        // Inicia o semi-arco de subida
        this._faseArco = 'subida';
        this._xf_arco  = xf;
        this._yf_arco  = this.chaoY - 80;     // nível do chão para a descida
        this._apiceY   = apiceY;
        this._xMeio    = xMeio;
        this._T_arco   = T_subida;

        this.animarBoss(xi, yi, xMeio, apiceY, T_subida, this.bossGfxCont);
    }

    _desenharFundoMaquina(w, h) {
        var bg = this.add.graphics().setDepth(0);
        bg.fillStyle(0x000510, 1);
        bg.fillRect(0, 0, w, h);

        var grid = this.add.graphics().setDepth(1);
        grid.lineStyle(1, 0x003311, 0.6);
        for (var gx = 0; gx < w; gx += 40) {
            grid.beginPath(); grid.moveTo(gx, 0); grid.lineTo(gx, h); grid.strokePath();
        }
        for (var gy = 0; gy < h; gy += 40) {
            grid.beginPath(); grid.moveTo(0, gy); grid.lineTo(w, gy); grid.strokePath();
        }

        var circuit = this.add.graphics().setDepth(2);
        var trilhas = [
            {y:h*0.15, x1:0, x2:w*0.3},{y:h*0.15, x1:w*0.5, x2:w},
            {y:h*0.32, x1:w*0.2, x2:w*0.65},{y:h*0.55, x1:0, x2:w*0.4},
            {y:h*0.55, x1:w*0.6, x2:w},{y:h*0.72, x1:w*0.1, x2:w*0.8},
            {y:h*0.88, x1:0, x2:w},
        ];
        trilhas.forEach(function(t) {
            circuit.lineStyle(2, 0x00cc44, 0.35);
            circuit.beginPath(); circuit.moveTo(t.x1, t.y); circuit.lineTo(t.x2, t.y); circuit.strokePath();
            circuit.fillStyle(0x00ff66, 0.7);
            circuit.fillCircle(t.x1 + (t.x2-t.x1)*0.25, t.y, 3);
            circuit.fillCircle(t.x1 + (t.x2-t.x1)*0.75, t.y, 3);
        });

        var floor = this.add.graphics().setDepth(3);
        floor.fillStyle(0x001a08, 1);
        floor.fillRect(0, h * 0.68, w, h * 0.32);
        floor.lineStyle(2, 0x00ff44, 0.5);
        floor.beginPath(); floor.moveTo(0, h*0.68); floor.lineTo(w, h*0.68); floor.strokePath();
        floor.lineStyle(1, 0x00cc33, 0.4);
        for (var fx = 40; fx < w; fx += 60) {
            floor.fillStyle(0x003311, 0.6);
            floor.fillRoundedRect(fx, h*0.70, 40, 20, 4);
            floor.lineStyle(1, 0x00cc33, 0.5);
            floor.strokeRoundedRect(fx, h*0.70, 40, 20, 4);
        }

        this.add.text(w/2, h*0.08, '⚠  ZONA DE INFECÇÃO CRÍTICA  ⚠', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(16), color:'#ff3300',
            stroke:'#000', strokeThickness:4
        }).setOrigin(0.5).setDepth(4);

        var tubos = this.add.graphics().setDepth(2);
        [[0, h*0.2, 18, h*0.5], [w-18, h*0.2, 18, h*0.5]].forEach(function(t) {
            tubos.fillStyle(0x002211, 1);
            tubos.fillRect(t[0], t[1], t[2], t[3]);
            tubos.lineStyle(1, 0x00ff44, 0.5);
            tubos.strokeRect(t[0], t[1], t[2], t[3]);
        });
    }

    _desenharBoss(scale) {
        this.bossGfxCont.removeAll(true);
        var g = this.add.graphics();
        var size = 130 * scale;
        g.fillStyle(0x440000, 1); g.fillCircle(0, 0, size);
        g.lineStyle(3, 0xff2200, 0.9); g.strokeCircle(0, 0, size);
        g.fillStyle(0xff0000, 0.8); g.fillCircle(0, 0, size * 0.55);
        g.fillStyle(0xffcc00, 1); g.fillCircle(0, -size*0.05, size * 0.22);
        g.fillStyle(0x110000, 1); g.fillCircle(0, -size*0.05, size * 0.12);
        var numEspinhos = 10;
        for (var sp = 0; sp < numEspinhos; sp++) {
            var ang = (sp / numEspinhos) * Math.PI * 2;
            var x1 = Math.cos(ang) * size * 0.9;
            var y1 = Math.sin(ang) * size * 0.9;
            var x2 = Math.cos(ang) * (size * 1.4);
            var y2 = Math.sin(ang) * (size * 1.4);
            g.lineStyle(4, 0xff4400, 0.9);
            g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
            g.fillStyle(0xff6600, 1); g.fillCircle(x2, y2, size * 0.08);
        }
        g.lineStyle(2, 0xff0000, 0.3); g.strokeCircle(0, 0, size * 1.6);
        g.lineStyle(1, 0xff5500, 0.2); g.strokeCircle(0, 0, size * 1.85);
        var gText = this.add.text(-size*0.35, size*1.7, '01001000 VÍRUS', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(10), color:'#ff4444',
            stroke:'#000', strokeThickness:2
        }).setOrigin(0.5).setDepth(8);
        this.bossGfxCont.add([g, gText]);
        this.bossGfxCont.setScale(scale);
    }

    _iniciarParticulasGlitch(w, h) {
        var scene = this;
        this.time.addEvent({delay:150, loop:true, callback:function(){
            if(scene.transitando) return;
            if(Math.random() > 0.4) return;
            var gx2 = Phaser.Math.Between(0, w);
            var gy2 = Phaser.Math.Between(0, h*0.65);
            var gl = scene.add.graphics().setDepth(3);
            gl.fillStyle(0x00ff44, Phaser.Math.FloatBetween(0.1, 0.5));
            gl.fillRect(gx2, gy2, Phaser.Math.Between(8, 60), Phaser.Math.Between(2, 4));
            scene.tweens.add({targets:gl, alpha:0, duration:120, onComplete:function(){gl.destroy();}});
        }});
    }

    atualizarBossGrafico(pct) {
        if(this.bossGfxCont) {
            var novaEscala = Math.max(0.35, pct);
            this.bossGfxCont.removeAll(true);
            var g = this.add.graphics();
            var size = 80 * novaEscala;
            g.fillStyle(0x440000, 1); g.fillCircle(0,0,size);
            g.lineStyle(3,0xff2200,0.9); g.strokeCircle(0,0,size);
            g.fillStyle(0xff0000,0.8); g.fillCircle(0,0,size*0.55);
            g.fillStyle(0xffcc00,1); g.fillCircle(0,-size*0.05,size*0.22);
            g.fillStyle(0x110000,1); g.fillCircle(0,-size*0.05,size*0.12);
            for(var sp=0;sp<10;sp++){
                var ang=(sp/10)*Math.PI*2;
                g.lineStyle(4,0xff4400,0.9);
                g.beginPath();
                g.moveTo(Math.cos(ang)*size*0.9, Math.sin(ang)*size*0.9);
                g.lineTo(Math.cos(ang)*size*1.4, Math.sin(ang)*size*1.4);
                g.strokePath();
                g.fillStyle(0xff6600,1);
                g.fillCircle(Math.cos(ang)*size*1.4, Math.sin(ang)*size*1.4, size*0.08);
            }
            g.lineStyle(2,0xff0000,0.3); g.strokeCircle(0,0,size*1.6);
            var gText2=this.add.text(-size*0.35,size*1.7,'01001000 VÍRUS',{
                fontFamily:'Orbitron',fontSize:scaleFontSize(10),color:'#ff4444',stroke:'#000',strokeThickness:2
            }).setOrigin(0.5).setDepth(8);
            this.bossGfxCont.add([g, gText2]);
            this.bossGfxCont.setScale(novaEscala);
        }
    }

    atualizarBara(){
        var bw=380, bh=22, bx=this.scale.width/2-190, by=30, pct=this.bossVida/this.bossMaxVida;
        this.baraBg.clear();
        this.baraBg.fillStyle(0x220011,1); this.baraBg.fillRoundedRect(bx-3,by-3,bw+6,bh+6,7);
        this.baraBg.lineStyle(2,0xff2244,0.7); this.baraBg.strokeRoundedRect(bx-3,by-3,bw+6,bh+6,7);
        this.baraFill.clear();
        var corBarra = pct > 0.5 ? 0xff2244 : (pct > 0.25 ? 0xff6600 : 0xff0000);
        this.baraFill.fillStyle(corBarra,1);
        this.baraFill.fillRoundedRect(bx,by,Math.max(4,bw*pct),bh,5);
        this.baraTxt.setText(this.bossVida+' / '+this.bossMaxVida).setPosition(this.scale.width/2, by+bh+10);
    }

    atacar(){
        if(this.bossVida<=0||this.transitando)return;
        this.bossVida--;
        var pct = this.bossVida/this.bossMaxVida;
        this.atualizarBossGrafico(pct);
        this.atualizarBara();
        var fl=this.add.graphics().setScrollFactor(0).setDepth(60);
        fl.fillStyle(0xffffff,0.25); fl.fillRect(0,0,this.scale.width,this.scale.height);
        var scene=this;
        this.tweens.add({targets:fl,alpha:0,duration:180,onComplete:function(){fl.destroy();}});
        if(this.bossVida<=0) this.vitoria();
    }

    vitoria(){
        this.transitando=true; bossDerrotado=true;
        chefe2Concluido=false; supervisor2Concluido=false;
        var bx=this.bossX, by=this.bossY, scene=this;
        for(var i=0;i<18;i++){
            this.time.delayedCall(i*80,function(){
                var ex=bx+Phaser.Math.Between(-90,90), ey=by+Phaser.Math.Between(-90,90);
                var b=scene.add.graphics().setDepth(50);
                b.fillStyle(0xff4400,0.85); b.fillCircle(ex,ey,Phaser.Math.Between(10,32));
                scene.tweens.add({targets:b,alpha:0,scaleX:2.5,scaleY:2.5,duration:420,onComplete:function(){b.destroy();}});
            });
        }
        this.time.delayedCall(1400,function(){
            notif(scene,'✔ Vírus derrotado! Voltando ao 2º Andar...','#00ff88');
            scene.time.delayedCall(2200,function(){
                scene.cameras.main.fadeOut(600,0,0,0);
                scene.cameras.main.once('camerafadeoutcomplete',function(){
                    scene.scene.start('SegundoAndarScene', { fromBoss: true });
                });
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // update — processa a animação cinemática frame a frame
    //
    // A cada frame:
    //   dt = delta / 1000  (conversão ms → s)
    //   t  acumulado até T
    //
    // Eixo X (MU):
    //   x(t) = xi + vx · t
    //   Console: velocidade (constante) e posição x resultante
    //
    // Eixo Y (MUV, v0=0):
    //   vy(t) = ay · t
    //   y(t)  = yi + 0.5 · ay · t²
    //   Console: aceleração, velocidade e posição y resultante
    // ─────────────────────────────────────────────────────────────────────────
    update(time, delta){
        if(this.transitando) return;

        moverPlayer(this);

        var distBoss = Math.abs(this.player.x - this.bossX);
        var perto = distBoss <= this.raioAtaque;
        this.indAtaque.setAlpha(perto ? 1 : 0);
        if(perto && Phaser.Input.Keyboard.JustDown(this.keyE)) this.atacar();

        // ── Processamento cinemático frame a frame ────────────────────────
        if (!this._anim || this._anim.done) return;

        var anim = this._anim;
        var dt = delta / 1000;          // delta em segundos

        // Avança cronômetro, limitando ao tempo total
        anim.t = anim.t + dt;
        var t = anim.t;
        if (t > anim.T) t = anim.T;    // clamp

        // ── Eixo X — MU ───────────────────────────────────────────────────
        // x(t) = xi + vx · t
        var xNovo = anim.xi + anim.vx * t;

        // ── Eixo Y — MUV (v0 = 0) ─────────────────────────────────────────
        // vy(t) = ay · t
        // y(t)  = yi + 0.5 · ay · t²
        var vyAtual = anim.ay * t;
        var yNovo   = anim.yi + 0.5 * anim.ay * t * t;

        // ── Console.log obrigatório ───────────────────────────────────────
        // MU  → imprime vx (constante) e posição x
        // MUV → imprime ay, vy e posição y
        console.log(
            '[t='+t.toFixed(3)+'s] ' +
            'MU  | vx='+anim.vx.toFixed(2)+'px/s  x='+xNovo.toFixed(1)+'px  ||  ' +
            'MUV | ay='+anim.ay.toFixed(2)+'px/s²  vy='+vyAtual.toFixed(2)+'px/s  y='+yNovo.toFixed(1)+'px'
        );

        // Aplica posição ao elemento gráfico
        anim.elem.x = xNovo;
        anim.elem.y = yNovo;
        this.bossX  = xNovo;
        this.bossY  = yNovo;

        // Atualiza label do boss
        if (this.bossTxtLabel) {
            this.bossTxtLabel.x = xNovo;
            this.bossTxtLabel.y = yNovo - 130;
        }

        // ── Verifica fim do arco atual ────────────────────────────────────
        if (anim.t >= anim.T) {
            anim.done = true;

            // Garante posição exata no destino
            anim.elem.x = anim.xf;
            anim.elem.y = anim.yf;
            this.bossX  = anim.xf;
            this.bossY  = anim.yf;

            console.log('=== Arco concluído ('+this._faseArco+'). Posição final: x='+anim.xf+' y='+anim.yf+' ===');

            // Encadeia o próximo semi-arco ou inicia novo arco completo
            var scene = this;
            if (!this.transitando) {
                if (this._faseArco === 'subida') {
                    // Descida: do ápice até o nível do chão no destino final
                    this._faseArco = 'descida';
                    this.animarBoss(
                        this._xMeio, this._apiceY,
                        this._xf_arco, this._yf_arco,
                        this._T_arco, this.bossGfxCont
                    );
                } else {
                    // Novo arco completo após breve pausa
                    this.time.delayedCall(200, function() {
                        if (!scene.transitando) scene._proximoArco();
                    });
                }
            }
        }
    }
}


// TERCEIRO ANDAR
// ── O minigame deste andar agora é o MinigameConexoesScene (antigo 4º andar)
class TerceiroAndarScene extends Phaser.Scene {
    constructor() { super({ key: 'TerceiroAndarScene' }); }

    init(data) {
        this.fromBoss = data && data.fromBoss ? true : false;
        this.afterCutscene = data && data.afterCutscene ? true : false;
    }

    preload(){
        this.load.image('cenario3','./assets/3_andar_jogo.jpeg');
        this.load.spritesheet('player','./assets/Sprite-0001-Sheet2.png',{ frameWidth: 1140, frameHeight: 1940 });
    }

    create() {
      var w = this.scale.width, h = this.scale.height;
      tocarMusica(this, 'resto');

      var mundo = setupMundo(this, 'cenario3', 1.0);
      this.physics.world.setBounds(0, 0, mundo.worldWidth, h);

      var e = mundo.escala, cy = mundo.chaoY;
      this.zonaChefe = { x1: 550 * e, x2: 980 * e };
      this.zonaPC = { x1: 1600 * e, x2: 1980 * e };
      this.zonaTela = { x1: 800 * e, x2: 1000 * e };
      this.zonaElev = { x1: 20 * e, x2: 310 * e };
      this.zonaSupervisor = { x1: 1560 * e, x2: 1780 * e };

      // ── O jogador nasce em x=200. Após a cutscene, passa a nascer em frente ao THK.BOT. Caso conclua o minigame, passa a nascer em frente ao computador.
      var startX = 200;
      if (minigameFiles3Concluido) {
          startX = 1660 * e;
      } else if (this.afterCutscene) {
          startX = (this.zonaTela.x1 + this.zonaTela.x2 + 600) / 2;
      } else {
          startX = (this.zonaElev.x1 + this.zonaElev.x2) / 2;
      }

      this.player = setupPlayer(this, startX, mundo.worldWidth, h, mundo.chaoY);
      setupAnims(this);
      this.cameras.main.setBounds(0, 0, mundo.worldWidth, h);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.fadeIn(500, 0, 0, 0);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D');
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.pausando = false; this.transitando = false;

      this.dlgBox = new DialogBox(this);

      this.indChefe = criarIndE(this, '[ E ] Falar com Assistente', 0.44);
      this.indPC = criarIndE(this, '[ E ] Usar Computador', 0.44);
      this.indElev = criarIndE(this, '[ E ] Elevador', 0.44);
      this.indSupervisor = criarIndE(this, '[ E ] Falar com Supervisor', 0.44);

      this.add.text(1300 * e, cy - 28, '▼ ASSISTENTE', { fontFamily: 'Orbitron', fontSize: scaleFontSize(13), color: '#00d4ff' }).setOrigin(0.5).setDepth(5);
      this.add.text(2000 * e, cy - 28, '▼ COMPUTADOR', { fontFamily: 'Orbitron', fontSize: scaleFontSize(13), color: '#aaffff' }).setOrigin(0.5).setDepth(5);

      var self = this;

      if (this.fromBoss && !chefe3Concluido) {
          this.time.delayedCall(600, function () {
              self.player.setVelocityX(0);
              self.player.anims.play('idle', true);
              self.dlgBox.show(DIALOGOS.andar3Pos, function () {
                  chefe3Concluido = true;
                  notif(self, '💻 Vá ao Computador para a missão do 3º Andar!', '#00d4ff');
              });
          });
      }

      if (this.afterCutscene) {
          notif(this, 'Fale com o Assistente!', '#00d4ff');
      }
}
    iniciarDialogoChefe(){
        if(!cutscene3Feita) return;
        if(chefe3Concluido) return;
        
        this.player.setVelocityX(0); 
        this.player.anims.play('idle',true);
        var scene=this;
        this.dlgBox.show(DIALOGOS.andar3, function() {
            chefe3Concluido=true;
            notif(scene,'💻 Vá ao Computador para a terceira missão!','#00d4ff');
        });
    }

    iniciarDialogoChefePos(){
        if(!chefe3PosConcluido && !this.dlgBox.ativo) {
            this.player.setVelocityX(0); this.player.anims.play('idle',true);
            var scene=this;
            this.dlgBox.show(DIALOGOS.andar3Pos, function() {
                chefe3PosConcluido=true;
                andar4Desbloqueado=true;
                notif(scene, '🏆 4º Andar desbloqueado! Vá ao elevador.', '#00ff88');
            });
        }
    }

    usarPC(){
        if(!chefe3Concluido){notif(this,'⚠ Fale com o Assistente antes!','#ff5555');return;}
        if(minigameFiles3Concluido){notif(this,'✔ Missão concluída! Vá ao elevador.','#00d4ff');return;}
        this.transitando=true;
        var scene=this;
        this.cameras.main.fadeOut(400,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('MinigameConexoesScene');});
    }

    irElevador(){
        if(this.transitando)return;
        this.transitando=true;
        var scene=this;
        this.cameras.main.fadeOut(500,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('ElevatorScene');});
    }

    update(){
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (toggleIdAnaOverlay(this)) return;
        }
        if (this.idAnaOverlay) return;

        if(this.dlgBox.ativo){
            this.player.setVelocityX(0); this.player.anims.play('idle',true);
            if(Phaser.Input.Keyboard.JustDown(this.keyE))this.dlgBox.avancar();
            return;
        }
        moverPlayer(this);
        var px=this.player.x;
        var naChefe=px>=this.zonaChefe.x1&&px<=this.zonaChefe.x2;
        var naPC   =px>=this.zonaPC.x1   &&px<=this.zonaPC.x2;
        var naElev =px>=this.zonaElev.x1 &&px<=this.zonaElev.x2;

        if (this.afterCutscene && naChefe && !chefe3Concluido) {
            this.iniciarDialogoChefe();
      }
        
        if(naChefe && minigameFiles3Concluido && !chefe3PosConcluido && !this.dlgBox.ativo) {
            this.iniciarDialogoChefePos();
        }

        this.indChefe.setAlpha(0);
        this.indPC.setAlpha(naPC?1:0);
        this.indElev.setAlpha(naElev?1:0);
        if(naPC   &&Phaser.Input.Keyboard.JustDown(this.keyE))this.usarPC();
        if(naElev &&Phaser.Input.Keyboard.JustDown(this.keyE))this.irElevador();
        
        // Ao se aproximar da tela, a cutscene roda.
        if (!cutscene3Feita && !this.cutsceneFeita && px >= this.zonaTela.x1 + 200 && px <= this.zonaTela.x2) {
            this.cutsceneFeita = true;
            this.transitando = true;
            this.player.setVelocityX(0);
            this.player.anims.play('idle', true);
        
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Cutscene3Andar');
            });
        }
    }
}

// Cutscene do terceiro andar.
class Cutscene3Andar extends Phaser.Scene {
    constructor() { super({ key: 'Cutscene3Andar' }); }

    preload() {
        this.load.image('cutscene3', './assets/cutscene3.jpeg');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.uiCam = this.cameras.add(0, 0, w, h);
        
        this.img = this.add.image(w / 2, h / 2, 'cutscene3');
        let scale = h / this.img.height;
        this.img.setScale(scale);
        this.img.setDepth(1);

        this.dlgBox = new DialogBox(this);
        
        // Predefinições da câmera
        this.cameras.main.ignore(this.dlgBox.cont);
        this.uiCam.ignore(this.img);

        // Posiciona e adiciona zoom à câmera.
        var overflow = (this.img.displayWidth - w) / 2;
        this.cameras.main.scrollX = overflow;
        this.cameras.main.setZoom(1.5); 

        // Durante a cutscene, roda o diálogo e tira o zoom.
        this.dlgBox.show(DIALOGOS.cutscene3AndarParte1, () => {
            this.tweens.add({
                targets: this.cameras.main,
                scrollX: -overflow,
                zoom: 1.0,
                duration: 2500,
                ease: 'Power2',
                onComplete: () => {
                    cutscene3AndarParte1Feita = true;
                    this.dlgBox.show(DIALOGOS.cutscene3AndarParte2, () => {
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.uiCam.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            cutscene3AndarParte2Feita = true;
                            cutscene3Feita = true;
                            this.scene.start('TerceiroAndarScene', { afterCutscene: true }); 
                        });
                    });
                }
            });
        });
    }

    update() {
        if (this.dlgBox.ativo && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E))) {
            this.dlgBox.avancar();
        }
    }
}
// MINIGAME TERCEIRO ANDAR (agora MinigameConexoesScene – trocado com 4º)
// Mantido no slot do 3º: MinigameConexoesScene
// ──────────────────────────────────────────────────────────────────────────

// QUARTO ANDAR
// ── O minigame deste andar agora é o MinigameFilesScene (antigo 3º andar)
class QuartoAndarScene extends Phaser.Scene {
    constructor() { super({ key: 'QuartoAndarScene' }); }

    preload(){
        this.load.image('cenario4andar','./assets/quartoAndar.jpeg');
        this.load.spritesheet('player','./assets/Sprite-0001-Sheet2.png',{ frameWidth: 1140, frameHeight: 1940 });
    }

    create(){
        var w=this.scale.width, h=this.scale.height;
        tocarMusica(this, 'resto');

        var mundo=setupMundo(this,'cenario4andar',1.0);
        this.physics.world.setBounds(0,0,mundo.worldWidth,h);
        var startX = minigame4Iniciado ? 1760 : 200;
        this.player=setupPlayer(this, startX, mundo.worldWidth, h, mundo.chaoY);
        setupAnims(this);
        this.cameras.main.setBounds(0,0,mundo.worldWidth,h);
        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.cameras.main.fadeIn(500,0,0,0);

        this.cursors=this.input.keyboard.createCursorKeys();
        this.keys=this.input.keyboard.addKeys('W,A,S,D');
        this.keyE=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.pauseKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pausando=false; this.transitando=false;

        var e=mundo.escala, cy=mundo.chaoY;
        this.zonaChefe={x1:1200*e, x2:1480*e};
        this.zonaPC   ={x1:1000*e, x2:1150*e};
        this.zonaElev ={x1:20*e,   x2:310*e };

        this.dlgBox = new DialogBox(this);

        this.indChefe=criarIndE(this,'[ E ] Falar com Coordenadora',0.44);
        this.indPC   =criarIndE(this,'[ E ] Usar Computador',   0.44);
        this.indElev =criarIndE(this,'[ E ] Elevador',           0.44);

        this.add.text(1300*e,cy-28,'▼ COORDENADORA-CHEFE',{fontFamily:'Orbitron',fontSize:scaleFontSize(13),color:'#00d4ff'}).setOrigin(0.5).setDepth(5);
        this.add.text(2000*e,cy-28,'▼ COMPUTADOR',     {fontFamily:'Orbitron',fontSize:scaleFontSize(13),color:'#aaffff'}).setOrigin(0.5).setDepth(5);

        this.add.text(w/2, 14, '4º ANDAR — LABORATÓRIO DE IA', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(16), color:'#00d4ff',
            stroke:'#000', strokeThickness:3, backgroundColor:'#00000088', padding:{x:12,y:4}
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    }

    iniciarDialogoChefe(){
        if(chefe4Concluido_andar4||this.dlgBox.ativo) return;
        this.player.setVelocityX(0); this.player.anims.play('idle',true);
        var scene=this;
        this.dlgBox.show(DIALOGOS.chefe4Andar, function(){
            chefe4Concluido_andar4=true;
            notif(scene,'💻 Vá ao Computador para a missão final!','#00d4ff');
        });
    }

    dialogoAposErro(){
        if(minigame4Errado === true) {
            this.player.setVelocityX(0); this.player.anims.play('idle',true);
            var scene=this;
            this.dlgBox.show(DIALOGOS.chefe4AndarErro, function(){
                minigame4Errado = false;
                notif(scene,'💻 Tente novamente!','#00d4ff');
            });
        }
    }
    
    dialogoAposMinigame(){
        if(minigame4Concluido === true && !fimDoJogo) {
           this.player.setVelocityX(0); this.player.anims.play('idle',true);
            var scene=this;
            this.dlgBox.show(DIALOGOS.chefe4AndarFim, function(){
                fimDoJogo = true;
                scene.cameras.main.fadeOut(500,0,0,0);
                scene.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('CutsceneCidade');});
            }); 
        }
    }

    ultimaCutscene(){
        if(fimDoJogo && !ultimaCutsceneFeita) {
            ultimaCutsceneFeita = true
            var scene=this;
            this.cameras.main.fadeOut(1000,0,0,0);
            this.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('Cutscene4Andar');});
        }
    }
    usarPC(){
        if(!chefe4Concluido_andar4){notif(this,'⚠ Fale com o COORDENADORA-CHEFE antes!','#ff5555');return;}
        if(minigame4Concluido){notif(this,'✔ Missão do 4º Andar concluída!','#00d4ff');return;}
        this.transitando=true;
        var scene=this;
        this.cameras.main.fadeOut(400,0,0,0);
        // Minigame do 4º andar → agora é o MinigameFilesScene (trocado com o 3º)
        this.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('MinigameFilesScene');});
    }

    irElevador(){
        if(this.transitando) return;
        this.transitando=true;
        var scene=this;
        this.cameras.main.fadeOut(500,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',function(){scene.scene.start('ElevatorScene');});
    }

    update(){
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (toggleIdAnaOverlay(this)) return;
        }
        if (this.idAnaOverlay) return;

        if(this.dlgBox.ativo){
            this.player.setVelocityX(0); this.player.anims.play('idle',true);
            if(Phaser.Input.Keyboard.JustDown(this.keyE)) this.dlgBox.avancar();
            return;
        }
        moverPlayer(this);
        var px=this.player.x;
        var naChefe=px>=this.zonaChefe.x1&&px<=this.zonaChefe.x2;
        var naPC   =px>=this.zonaPC.x1   &&px<=this.zonaPC.x2;
        var naElev =px>=this.zonaElev.x1 &&px<=this.zonaElev.x2;

        if(naChefe&&!chefe4Concluido_andar4&&!this.dlgBox.ativo) this.iniciarDialogoChefe();
        if(minigame4Errado&&chefe4Concluido_andar4) this.dialogoAposErro();
        if(chefe4Concluido_andar4&&minigame4Iniciado&&!fimDoJogo) this.dialogoAposMinigame();
        // Removed ultimaCutscene call as it's now handled in dialogoAposMinigame

        this.indChefe.setAlpha(0);
        this.indPC.setAlpha(naPC?1:0);
        this.indElev.setAlpha(naElev?1:0);
        if(naPC   &&Phaser.Input.Keyboard.JustDown(this.keyE)) this.usarPC();
        if(naElev &&Phaser.Input.Keyboard.JustDown(this.keyE)) this.irElevador();
    }
}

// MINIGAME PASTAS — agora no 4º andar (era o 3º)
class MinigameFilesScene extends Phaser.Scene {
    constructor() { super({ key: 'MinigameFilesScene' }); }

    preload() {
        this.load.image('bg_mesa', 'assets/mesa4ideia.jpeg');
        reportsData.forEach(report => {
            this.load.image(report.imageKey, `assets/ficha${report.imageKey}.png`);
        });
    }

    create() {
        // reinicia o estado do minigame quando o jogador entrar nele
        currentReportIndex = 0;
        erros = 0;

        const larguraTela = this.cameras.main.width;
        const alturaTela = this.cameras.main.height;
        const centroX = larguraTela / 2;
        const centroY = alturaTela / 2;

        let bg = this.add.image(centroX, centroY, 'bg_mesa');
        
        let scaleX = larguraTela / bg.width;
        let scaleY = alturaTela / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);
        
        reportSprite = this.add.image(centroX + 50, centroY, reportsData[currentReportIndex].imageKey);
        reportSprite.setScale(Math.min(larguraTela / 1280, alturaTela / 720) * 1);

        const botaoY = centroY + alturaTela * 0.31;
        
        botoesMinigame = [];

        const offsetX = larguraTela * 0.03;

        botoesMinigame.push(criarBotaoMiniGameFiles(this, centroX - larguraTela * 0.06 + offsetX, botaoY, 'DAR BÔNUS', 0x1A8E2D, () => {
            processChoice(this, true);
        }));

        botoesMinigame.push(criarBotaoMiniGameFiles(this, centroX + larguraTela * 0.06 + offsetX, botaoY, 'MANDAR P/ RH', 0xD32F2F, () => {
            processChoice(this, false);
        }));
    }
}

 let currentReportIndex = 0;
 let reportSprite;
 let erros = 0;
 let botoesMinigame = []; // Armazenar referências aos botões para ocultá-los depois

 const reportsData = [
     { imageKey: 'Gilberto', isEthical: true },
     { imageKey: 'Lara2', isEthical: false },
     { imageKey: 'Thiago2', isEthical: true }, 
     { imageKey: 'Sandra2', isEthical: false }   
 ];

 function criarBotaoFimMinigame(scene, x, y, texto, corHex, callback) {
    let botaoFim = scene.add.rectangle(x, y, scaleDim(140), scaleDim(40), corHex)
        .setInteractive({ useHandCursor: true });

    // Borda preta para combinar com a pixelart
    botaoFim.setStrokeStyle(2, 0x000000);
    botaoFim.setScale(1.2);

    scene.add.text(x, y, texto, { 
    fontSize: scaleFontSize(14), 
        fontFamily: '"Comic Sans MS"',
        fill: '#ffffff', 
        fontStyle: 'bold' 
    }).setOrigin(0.5);

    // Efeitos ao passar o mouse
    botaoFim.on('pointerdown', callback);
    botaoFim.on('pointerover', () => botaoFim.setAlpha(0.8)); // Fica levemente transparente 
    botaoFim.on('pointerout', () => botaoFim.setAlpha(1));    // Volta ao normal
 }

 function criarBotaoMiniGameFiles(scene, x, y, texto, corHex, callback) {
    let botao = scene.add.rectangle(0, 0, scaleDim(140), scaleDim(40), corHex)
        .setInteractive({ useHandCursor: true });

    // Borda preta para combinar com a pixelart
    botao.setStrokeStyle(2, 0x000000);
    botao.setScale(1.2);

    let textoBotao = scene.add.text(0, 0, texto, { 
        fontSize: scaleFontSize(14),
        fontFamily: '"Courier New", Courier, monospace',
        fill: '#ffffff', 
        fontStyle: 'bold' 
    }).setOrigin(0.5);

    // Criar um container para agrupar botão e texto
    let container = scene.add.container(x, y);
    container.add([botao, textoBotao]);

    // Efeitos ao passar o mouse
    botao.on('pointerdown', callback);
    botao.on('pointerover', () => botao.setAlpha(0.8)); // Fica levemente transparente 
    botao.on('pointerout', () => botao.setAlpha(1));    // Volta ao normal
    
    return container;
 }

function processChoice(scene, playerChoseEthical) {
    const currentReport = reportsData[currentReportIndex];

    // Verifica se o jogador errou
    if (playerChoseEthical !== currentReport.isEthical) {
        erros++;
        console.log(`Erro! Total de erros: ${erros}`);
        
        // Condição de derrota: 2 erros
        if (erros >= 2) {
            finishGame(scene, false); // false = jogador perdeu
            return; // Para a execução da função aqui
        }
    }

    currentReportIndex++;

    // Verifica se há mais relatórios
    if (currentReportIndex < reportsData.length) {
        reportSprite.setTexture(reportsData[currentReportIndex].imageKey);
    } else {
        finishGame(scene, true); // true = jogador venceu (analisou todos os relatórios)
    }
    
}

//     create(){
//         var w=this.scale.width, h=this.scale.height;
//         this.add.rectangle(w/2,h/2,w,h,0x0b1220);
//         var mx=w*0.03,my=h*0.03,mw=w*0.94,mh=h*0.93;
//         desenharMonitor(this,mx,my,mw,mh);
//         this.add.text(mx+12,my+7,'◉  ThinkerOS — Arquivos da Empresa',{fontFamily:'Orbitron',fontSize:scaleFontSize(11),color:'#00d4ff'});

//         this.add.text(w/2,my+50,'ARQUIVOS DA EMPRESA',estiloTitulo(scaleFontSize(21))).setOrigin(0.5);
//         this.add.text(w/2,my+76,'Jogue as pastas SUSPEITAS na lixeira  (canto inferior direito)',
//             {fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#7090a0'}).setOrigin(0.5);

//         var lx=mx+mw-68, ly=my+mh-72;
//         this.lixX=lx; this.lixY=ly; this.lixR=62;
//         var lg=this.add.graphics().setDepth(5);
//         lg.fillStyle(0x1e2d44,1);lg.fillRoundedRect(lx-42,ly-52,84,96,10);
//         lg.lineStyle(2,0x445566,0.9);lg.strokeRoundedRect(lx-42,ly-52,84,96,10);
//         lg.fillStyle(0x2a3a50,1);lg.fillRect(lx-26,ly-28,52,46);
//         lg.fillStyle(0x334455,1);lg.fillRect(lx-30,ly-34,60,8);
//         lg.fillRoundedRect(lx-11,ly-44,22,12,4);
//         lg.lineStyle(1.5,0x6688aa,0.6);lg.strokeRect(lx-26,ly-28,52,46);
//         for(var li=0;li<3;li++){lg.beginPath();lg.moveTo(lx-10+li*10,ly-22);lg.lineTo(lx-10+li*10,ly+10);lg.strokePath();}
//         this.add.text(lx,ly+50,'LIXEIRA',{fontFamily:'Orbitron',fontSize:scaleFontSize(10),color:'#7090a0'}).setOrigin(0.5).setDepth(6);

//         var pastas=[
//             {nome:'Funcionários',        virus:false},
//             {nome:'Cargos',              virus:false},
//             {nome:'Documentos',          virus:false},
//             {nome:'Propina Chefe',       virus:true, motivo:'Registros de pagamentos ilegais ao chefe, criados pelo vírus para chantagear e comprometer a empresa.'},
//             {nome:'Dados Pessoais\nClientes',virus:true,motivo:'Coleta ilegal de dados pessoais dos clientes, violando a LGPD. Arquivo implantado pelo vírus para roubo de informação.'},
//             {nome:'Spyware',             virus:true, motivo:'Programa espião instalado pelo vírus para monitorar e exfiltrar informações confidenciais da empresa.'},
//         ];

//         var cols=3,gsx=mx+mw*0.10,gsy=my+100,gspX=mw*0.28,gspY=155;
//         this.vDesc=0; this.vTotal=3; this.pastaCont=[];
//         var scene=this;

//         pastas.forEach(function(p,i){
//             var col=i%cols, row=Math.floor(i/cols);
//             var px=gsx+col*gspX, py=gsy+row*gspY;
//             var cont=scene.add.container(px,py).setDepth(10);
//             var ic=scene.add.graphics();
//             if(p.virus){
//                 ic.fillStyle(0x440000,1);ic.fillRoundedRect(-38,-30,76,60,7);
//                 ic.fillStyle(0x660000,1);ic.fillRect(-38,-15,76,45);
//                 ic.lineStyle(2,0xff3333,0.8);ic.strokeRoundedRect(-38,-30,76,60,7);
//                 ic.fillStyle(0xff2222,1);ic.fillCircle(0,5,10);
//                 ic.lineStyle(1.5,0xff4444,1);
//                 for(var s=0;s<6;s++){var a=(s/6)*Math.PI*2;ic.beginPath();ic.moveTo(Math.cos(a)*9,Math.sin(a)*9+5);ic.lineTo(Math.cos(a)*17,Math.sin(a)*17+5);ic.strokePath();}
//             } else {
//                 ic.fillStyle(0x1a3a5f,1);ic.fillRoundedRect(-38,-30,76,60,7);
//                 ic.fillStyle(0x1e4d80,1);ic.fillRect(-38,-15,76,45);
//                 ic.lineStyle(1.5,CORES.borda,0.7);ic.strokeRoundedRect(-38,-30,76,60,7);
//                 ic.lineStyle(1,0x4488cc,0.5);
//                 for(var ll=0;ll<3;ll++){ic.beginPath();ic.moveTo(-22,-4+ll*12);ic.lineTo(22,-4+ll*12);ic.strokePath();}
//             }
//             var txt=scene.add.text(0,44,p.nome,{fontFamily:'Orbitron',fontSize:scaleFontSize(12),
//                 color:p.virus?'#ff8888':'#aaccee',align:'center',wordWrap:{width:82}}).setOrigin(0.5);
//             cont.add([ic,txt]);
//             cont.setSize(82,98).setInteractive({draggable:true});
//             scene.input.setDraggable(cont);
//             cont._virus=p.virus;cont._motivo=p.motivo||'';cont._sx=px;cont._sy=py;
//             scene.pastaCont.push(cont);
//         });

//         this.input.on('drag',function(_,o,dx,dy){o.x=dx;o.y=dy;o.setDepth(25);});
//         this.input.on('dragend',function(_,o){
//             o.setDepth(10);
//             var dist=Phaser.Math.Distance.Between(o.x,o.y,scene.lixX,scene.lixY);
//             if(dist<scene.lixR+30){
//                 if(o._virus){
//                     scene.vDesc++;
//                     var mot=o._motivo;
//                     scene.tweens.add({targets:o,alpha:0,scaleX:0.2,scaleY:0.2,duration:300,
//                         onComplete:function(){o.destroy();scene.mostrarExp(mot);}});
//                     if(scene.vDesc>=scene.vTotal) scene.time.delayedCall(500,function(){scene.mostrarFim();});
//                 } else {
//                     scene.tweens.add({targets:o,x:o._sx,y:o._sy,duration:380,ease:'Back.easeOut'});
//                     notif(scene,'⚠ Essa pasta é legítima! Não jogue fora.','#ffcc00');
//                 }
//             } else {
//                 scene.tweens.add({targets:o,x:o._sx,y:o._sy,duration:350,ease:'Back.easeOut'});
//             }
//         });

//         this.expBg =this.add.graphics().setDepth(70).setVisible(false);
//         this.expTxt=this.add.text(0,0,'',{fontFamily:'Orbitron',fontSize:scaleFontSize(13),color:'#ffffcc',
//             align:'center',wordWrap:{width:440},lineSpacing:7}).setDepth(71).setOrigin(0.5).setVisible(false);
//         this.expTit=this.add.text(0,0,'',{fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#ff4444',fontStyle:'bold'}).setDepth(71).setOrigin(0.5).setVisible(false);
//         var expBg=this.expBg, expTxt=this.expTxt, expTit=this.expTit;
//         this.expBtn=criarBotao(this,0,0,'OK, ENTENDI',function(){
//             expBg.setVisible(false);expTxt.setVisible(false);expTit.setVisible(false);scene.expBtn.setVisible(false);
//         },200,40);
//         this.expBtn.setVisible(false).setDepth(72);
//     }

//     mostrarExp(motivo){
//         var w=this.scale.width, h=this.scale.height;
//         this.expBg.clear().setVisible(true);
//         this.expBg.fillStyle(0x000000,0.80);this.expBg.fillRect(0,0,w,h);
//         this.expBg.fillStyle(CORES.fundoPanel,1);this.expBg.fillRoundedRect(w/2-240,h/2-110,480,220,14);
//         this.expBg.lineStyle(2,0xff4444,0.8);this.expBg.strokeRoundedRect(w/2-240,h/2-110,480,220,14);
//         this.expTit.setText('🗑 ARQUIVO MALICIOSO REMOVIDO').setPosition(w/2,h/2-78).setVisible(true);
//         this.expTxt.setText(motivo).setPosition(w/2,h/2+5).setVisible(true);
//         this.expBtn.setPosition(w/2,h/2+88).setVisible(true);
//     }

//     mostrarFim(){
//         minigame4Concluido = true;   // agora este é o minigame do 4º andar
//         andar4Desbloqueado = true;   // mantém compatibilidade
//         var w=this.scale.width, h=this.scale.height;
//         this.add.rectangle(w/2,h/2,w,h,0x000000,0.80).setDepth(80);
//         var p=this.add.graphics().setDepth(81);
//         p.fillStyle(CORES.fundoPanel,0.97);p.fillRoundedRect(w/2-275,h/2-128,550,280,14);
//         p.lineStyle(2,CORES.ciano,0.8);    p.strokeRoundedRect(w/2-275,h/2-128,550,280,14);
//         this.add.text(w/2,h/2-90,'🏆 MISSÃO CONCLUÍDA!',estiloTitulo(scaleFontSize(24))).setOrigin(0.5).setDepth(82);
//         this.add.text(w/2,h/2-30,'Você removeu todos os arquivos maliciosos!\nA empresa está protegida. Parabéns!',
//             {fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#E6F4FF',align:'center',lineSpacing:7}).setOrigin(0.5).setDepth(82);
//         criarBotao(this,w/2,h/2+74,'IR AO ELEVADOR',function(){this.scene.start('ElevatorScene');}.bind(this),240,44).setDepth(83);
//     }
// }



function finishGame(scene, won) {
    // Esconde a ficha atual
    reportSprite.setVisible(false);
    
    // Remove os botões de escolha
    botoesMinigame.forEach(botao => botao.destroy());

    // Calcula o centro da tela dinamicamente
    const larguraTela = scene.cameras.main.width;
    const alturaTela = scene.cameras.main.height;
    const centroX = larguraTela / 2;
    const centroY = alturaTela / 2;

    // Define a mensagem e a cor com base no resultado
    let mensagem = won ? "Expediente Concluído!\nÓtimo trabalho." : "Converse com a coordenadora!\nMuitos erros de avaliação.";
    let corFundo = won ? 0x1A8E2D : 0xD32F2F;

    // Adiciona fundo para a mensagem
    let bgText = scene.add.rectangle(centroX, centroY - 50 , centroX - 200, centroY - 100, corFundo);
    
    // Adiciona a mensagem
    scene.add.text(centroX, centroY - 50, mensagem, { 
    fontSize: scaleFontSize(35), 
        fontFamily: '"Courier New", Courier, monospace',
        fill: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);

    if (won) {
        minigame4Concluido = true;
        minigame4Errado = false;
        minigame4Iniciado = true
        criarBotaoFimMinigame(scene, centroX, centroY + 100, 'Continuar', 0x0d2340, () => {
            scene.scene.start('QuartoAndarScene');
        });;
    } else {
        minigame4Errado = true;
        minigame4Iniciado = true;
        criarBotaoFimMinigame(scene, centroX, centroY + 100, 'Continuar', 0x0d2340, () => {
            scene.scene.start('QuartoAndarScene');
        });
    }

    // reinicia os relatórios
    currentReportIndex = 0;
    erros = 0;
}

// MINIGAME CONEXÕES — agora no 3º andar (era o 4º)
class MinigameConexoesScene extends Phaser.Scene {
    constructor() { super({ key: 'MinigameConexoesScene' }); }

    create(){
        var w=this.scale.width, h=this.scale.height;
        this.add.rectangle(w/2,h/2,w,h,0x080e18);

        var mx=w*0.03, my=h*0.03, mw=w*0.94, mh=h*0.94;
        desenharMonitor(this,mx,my,mw,mh);
        this.add.text(mx+12,my+7,'◉  ThinkerOS — Rede Neural Conexões',{fontFamily:'Comic Sans MS',fontSize:scaleFontSize(13),color:'#00d4ff'});

        this.add.text(w/2,my+50,'CONECTAR CONCEITOS',estiloMinigame(scaleFontSize(26))).setOrigin(0.5);
        this.add.text(w/2,my+76,'Clique em um conceito e depois em sua definição para conectá-los',
            {fontFamily:'Comic Sans MS',fontSize:scaleFontSize(16),color:'#7090a0'}).setOrigin(0.5);

        this.errorCount=0;
        this.maxErrors=3;
        this.errorTxt=this.add.text(mx+16,my+mh-20,
            'Erros: 0 / '+this.maxErrors,
            {fontFamily:'Orbitron',fontSize:scaleFontSize(18),color:'#ff8888',stroke:'#000',strokeThickness:3}
        ).setDepth(10);

        this.connections=this.add.graphics().setDepth(6);
        this.selectedCard=null;
        this.matchCount=0;

        var leftData=[
            {text:'Dados\nCorrompidos',  key:'dc'},
            {text:'Feedback do\nAmbiente',        key:'overfitting'},
            {text:'Treinamento\nSupervisionado',            key:'dataset'},
            {text:'Viés no\nDataset',      key:'dl'},
            {text:'Re-treinamento',      key:'wl'},
            {text:'Agente\nInteligente',      key:'sl'},
        ];
        var rightData=[
            {text:'Informações inconsistentes\nque ensinam o\nagente a tomar decisões\nerradas',       key:'dc'},
            {text:'Sinal usado pelo agente\npara ajustar os\npesos da rede\ne melhorar',      key:'overfitting'},
            {text:'Processo onde humanos validam\nos dados antes\ndo agente aprender\ncom eles',            key:'dataset'},
            {text:'Quando os dados de treino\nfavorecem um padrão\ne o agente reproduz\nesse erro',key:'dl'},
            {text:'Processo de corrigir um\nagente expondo-o \nnovos dados de qualidade',      key:'wl'},
            {text:'Sistema que percebe, aprende\ncom Deep Learning\ne age de forma\nautônoma',      key:'sl'},
        ];

        Phaser.Utils.Array.Shuffle(rightData);

        var cw = w * 0.18, ch = h * 0.13;
        var leftX = mx + mw * 0.22, rightX = mx + mw * 0.78;
        var startY = my + h * 0.12, spacing = h * 0.13;;

        this.cards=[];
        var scene=this;

        function criarCard(cx,cy,texto,key,lado){
            var cont=scene.add.container(cx,cy).setDepth(10);
            var bg=scene.add.graphics();
            function drawBg(fill,brd){
                bg.clear();
                bg.fillStyle(fill,1); bg.fillRoundedRect(-cw/2,-ch/2,cw,ch,10);
                bg.lineStyle(2,brd,0.9); bg.strokeRoundedRect(-cw/2,-ch/2,cw,ch,10);
            }
            drawBg(CORES.fundoBotao,CORES.borda);
            var txt=scene.add.text(0,0,texto,{
            fontFamily:'Orbitron', fontSize:scaleFontSize(15), fontStyle:'bold',
            color:'#E6F4FF', align:'center', wordWrap:{width:cw - w*0.01}
            }).setOrigin(0.5);
            cont.add([bg,txt]);
            cont.setSize(cw,ch).setInteractive({useHandCursor:true});
            cont._key=key;
            cont._lado=lado;
            cont._drawBg=drawBg;
            cont._matched=false;
            cont.on('pointerover',function(){
                if(cont._matched)return;
                drawBg(CORES.fundoBotaoHov,CORES.ciano);
                txt.setColor('#00d4ff');
            });
            cont.on('pointerout',function(){
                if(cont._matched)return;
                if(scene.selectedCard===cont){
                    drawBg(0x0a2d50,0x00ffcc); txt.setColor('#00ffcc');
                } else {
                    drawBg(CORES.fundoBotao,CORES.borda); txt.setColor('#E6F4FF');
                }
            });
            cont.on('pointerdown',function(){
                if(cont._matched)return;
                scene.handleClick(cont);
            });
            scene.cards.push(cont);
            return cont;
        }

        leftData.forEach(function(d,i){
            criarCard(leftX, startY+i*spacing, d.text, d.key, 'left');
        });
        rightData.forEach(function(d,i){
            criarCard(rightX, startY+i*spacing, d.text, d.key, 'right');
        });

        var divG=this.add.graphics().setDepth(5);
        divG.lineStyle(1,CORES.ciano,0.2);
        divG.beginPath();
        divG.moveTo(w/2, my + scaleDim(96));
        divG.lineTo(w/2, my + mh - scaleDim(50));
        divG.strokePath();
        this.add.text(w/2, my + scaleDim(96),'⚡',{fontSize:scaleFontSize(18)}).setOrigin(0.5).setDepth(6);

        this.add.text(leftX,  my + scaleDim(88),'CONCEITOS', {fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#00d4ff',fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
        this.add.text(rightX, my + scaleDim(88),'DEFINIÇÕES',{fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#ffcc00',fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    }

    handleClick(card){
        if(!this.selectedCard){
            this.selectedCard=card;
            card._drawBg(0x0a2d50,0x00ffcc);
            card.list[1].setColor('#00ffcc');
            return;
        }
        if(this.selectedCard===card){
            card._drawBg(CORES.fundoBotao,CORES.borda);
            card.list[1].setColor('#E6F4FF');
            this.selectedCard=null;
            return;
        }
        var c1=this.selectedCard, c2=card;
        this.selectedCard=null;

        if(c1._lado===c2._lado){
            notif(this,'⚠ Selecione um conceito e uma definição!','#ffcc00');
            c1._drawBg(CORES.fundoBotao,CORES.borda); c1.list[1].setColor('#E6F4FF');
            return;
        }

        if(c1._key===c2._key){
            this._desenharLinha(c1,c2,0x00ff88);
            c1._drawBg(0x003322,0x00ff88); c1.list[1].setColor('#00ff88'); c1._matched=true; c1.disableInteractive();
            c2._drawBg(0x003322,0x00ff88); c2.list[1].setColor('#00ff88'); c2._matched=true; c2.disableInteractive();
            this.matchCount++;
            if(this.matchCount>=6) this.vitoria();
        } else {
            this._desenharLinha(c1,c2,0xff4444);
            this.errorCount++;
            this.errorTxt.setText('Erros: '+this.errorCount+' / '+this.maxErrors);
            c1._drawBg(0x330000,0xff4444); c1.list[1].setColor('#ff8888');
            c2._drawBg(0x330000,0xff4444); c2.list[1].setColor('#ff8888');
            var scene=this;
            this.time.delayedCall(700,function(){
                if(!c1._matched){c1._drawBg(CORES.fundoBotao,CORES.borda);c1.list[1].setColor('#E6F4FF');}
                if(!c2._matched){c2._drawBg(CORES.fundoBotao,CORES.borda);c2.list[1].setColor('#E6F4FF');}
                scene._redesenharLinhasVerdes();
            });
            if(this.errorCount>=this.maxErrors){
                this.time.delayedCall(900,function(){scene.gameOver();});
            }
        }
    }

    _desenharLinha(c1,c2,cor){
        this.connections.lineStyle(3,cor,0.85);
        this.connections.beginPath();
        this.connections.moveTo(c1.x,c1.y);
        this.connections.lineTo(c2.x,c2.y);
        this.connections.strokePath();
    }

    _redesenharLinhasVerdes(){
        this.connections.clear();
        var scene=this;
        this.cards.forEach(function(c1){
            if(!c1._matched||c1._lado!=='left') return;
            scene.cards.forEach(function(c2){
                if(!c2._matched||c2._lado!=='right') return;
                if(c1._key===c2._key){
                    scene.connections.lineStyle(3,0x00ff88,0.85);
                    scene.connections.beginPath();
                    scene.connections.moveTo(c1.x,c1.y);
                    scene.connections.lineTo(c2.x,c2.y);
                    scene.connections.strokePath();
                }
            });
        });
    }

    gameOver(){
        var w=this.scale.width, h=this.scale.height;
        this.add.rectangle(w/2,h/2,w,h,0x000000,0.78).setDepth(80);
        var p=this.add.graphics().setDepth(81);
        p.fillStyle(CORES.fundoPanel,0.97);p.fillRoundedRect(w/2-240,h/2-110,480,220,14);
        p.lineStyle(2,0xff4444,0.8);       p.strokeRoundedRect(w/2-240,h/2-110,480,220,14);
        this.add.text(w/2,h/2-68,'❌ REDE INSTÁVEL!',{fontFamily:'Orbitron',fontSize:scaleFontSize(24),color:'#ff4444',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setDepth(82);
        this.add.text(w/2,h/2-16,'Você errou muitas conexões.\nTente novamente!',
            {fontFamily:'Orbitron',fontSize:scaleFontSize(15),color:'#E6F4FF',align:'center',lineSpacing:7}).setOrigin(0.5).setDepth(82);
    
        this.input.enabled = true;
    
        var scene = this;
        var btn = this.add.text(w/2, h/2+68, 'TENTAR DE NOVO', {
            fontFamily:'Orbitron', fontSize:scaleFontSize(18), color:'#E6F4FF',
            backgroundColor:'#0d2340', padding:{x:20, y:12},
            stroke:'#0066cc', strokeThickness:2
        }).setOrigin(0.5).setDepth(83).setInteractive({useHandCursor:true});
    
        btn.on('pointerover',  function(){ btn.setColor('#00d4ff'); });
        btn.on('pointerout',   function(){ btn.setColor('#E6F4FF'); });
        btn.on('pointerdown',  function(){
            scene.scene.start('MinigameConexoesScene');
        });
    }

    vitoria(){
        minigameFiles3Concluido=true;   // agora é o minigame do 3º andar
        //andar4Desbloqueado=true;
        var w=this.scale.width, h=this.scale.height;
        this.add.rectangle(w/2,h/2,w,h,0x000000,0.78).setDepth(80);
        var p=this.add.graphics().setDepth(81);
        p.fillStyle(CORES.fundoPanel,0.97);p.fillRoundedRect(w/2-275,h/2-128,550,280,14);
        p.lineStyle(2,CORES.ciano,0.8);    p.strokeRoundedRect(w/2-275,h/2-128,550,280,14);
        this.add.text(w/2,h/2-90,'🏆 MISSÃO CONCLUÍDA!',estiloTitulo(scaleFontSize(22))).setOrigin(0.5).setDepth(82);
        this.add.text(w/2,h/2-28,
            'Parabéns! Você conectou todos os conceitos corretamente.\nO 4º Andar — laboratório de IA — foi desbloqueado!',
            {fontFamily:'Orbitron',fontSize:scaleFontSize(14),color:'#E6F4FF',align:'center',lineSpacing:7}
        ).setOrigin(0.5).setDepth(82);
        criarBotao(this,w/2,h/2+82,'Voltar',function(){this.scene.start('TerceiroAndarScene');}.bind(this),260,44).setDepth(83);
    }
}

class CutsceneCidade extends Phaser.Scene {
    constructor() { super({ key: 'CutsceneCidade' }); }

    preload() {
        this.load.image('cidadeDia', 'assets/cidadeDia.jpeg');
        this.load.image('cidadeNoite', 'assets/cidadeNoite.jpeg');

    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.uiCam = this.cameras.add(0, 0, w, h);

        this.img = this.add.image(w / 2 - 400, h / 2, 'cidadeDia');
        this.imag = this.add.image(w / 2 - 400, h / 2, 'cidadeNoite').setAlpha(1).setDepth(8);
        let scale = h / this.img.height;
        this.img.setScale(scale);
        this.imag.setScale(scale);
        this.img.setDepth(1);

        this.img.setAlpha(0);
        this.imag.setAlpha(1);

        this.time.delayedCall(2000, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.uiCam.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.imag.setAlpha(0);
                this.img.setAlpha(1);
                this.cameras.main.fadeIn(1200, 0, 0, 0);
                this.uiCam.fadeIn(1200, 0, 0, 0);
                this.cameras.main.once('camerafadeincomplete', () => {
                    this.scene.start('Cutscene4Andar');
                });
            });
        });
    }
}
     
//Estrutura de cutscene semelhante à do terceiro andar.     
class Cutscene4Andar extends Phaser.Scene {
    constructor() { super({ key: 'Cutscene4Andar' }); }

    preload() {
        this.load.image('cutscene4', 'assets/cutscene4.jpeg');
        this.load.image('cidadeDia', 'assets/cidadeDia.jpeg');
        this.load.image('cidadeNoite', 'assets/cidadeNoite.jpeg');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.uiCam = this.cameras.add(0, 0, w, h);
        
        this.img = this.add.image(w / 2, h / 2, 'cutscene4');
        let scale = h / this.img.height;
        this.img.setScale(scale);
        this.img.setDepth(1);

        this.dlgBox = new DialogBox(this);
        
        this.cameras.main.ignore(this.dlgBox.cont);
        this.uiCam.ignore(this.img);

        var overflow = (this.img.displayWidth - w) / 2;
        this.cameras.main.scrollX = overflow;
        this.cameras.main.setZoom(1.1); 

        this.tweens.add({
            targets: this.cameras.main,
            scrollX: -overflow,
            zoom: 1.0,
            duration: 2500,
            ease: 'Power2'
        });

        this.dlgBox.show(DIALOGOS.cutscene4Andar, () => {
            
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.uiCam.fadeOut(500, 0, 0, 0);
            
            this.cameras.main.once('camerafadeoutcomplete', () => {
                
                this.scene.start('MenuScene', { afterCutscene: true }); 
            });
        });
    }

    update() {
        // Avança o diálogo ao pressionar 'E'
        if (this.dlgBox.ativo && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E))) {
            this.dlgBox.avancar();
        }
    }
}   

// PAUSA 1 ANDAR
class PauseScene extends Phaser.Scene {
    constructor() { super({ key: 'PauseScene' }); }

    create(){
        var w=this.scale.width, h=this.scale.height;
        var pw=w*0.40, ph=h*0.60, px=w/2, py=h/2;
        this.add.rectangle(px,py,w,h,0x000000,0.72);
        this.add.rectangle(px,py,pw,ph,CORES.fundoPanel,0.97);
        var g=this.add.graphics();
        g.lineStyle(1.5,CORES.ciano,0.55);g.strokeRoundedRect(px-pw/2,py-ph/2,pw,ph,14);
        this.add.text(px,py-ph*0.33,'PAUSADO',estiloTitulo(scaleFontSize(Math.round(pw*0.10)))).setOrigin(0.5);
        linhaDecorativa(this,px,py-ph*0.22,pw*0.45);
        var bw=pw*0.72, scene=this;
        criarBotao(this,px,py-ph*0.08,'CONTINUAR',function(){
            scene.scene.stop();
            var alvo=scene.scene.manager.isActive('PrimeiroAndarScene')?'PrimeiroAndarScene':'GameScene';
            scene.scene.resume(alvo);
            var c=scene.scene.get(alvo); if(c)c.pausando=false;
        },bw);
        criarBotao(this,px,py+ph*0.10,'TUTORIAL',function(){scene.registry.set('fromPause',true);scene.scene.start('TutorialScene',{fromPause:true});},bw);
        criarBotao(this,px,py+ph*0.28,'SAIR AO MENU',function(){scene.scene.stop('PauseScene');scene.scene.stop('GameScene');scene.scene.stop('PrimeiroAndarScene');scene.scene.start('MenuScene');},bw);
    }
}

// PAUSA 2, 3 E 4 ANDARES
class PauseScene2 extends Phaser.Scene {
    constructor() { super({ key: 'PauseScene2' }); }

    create(){
        var w=this.scale.width, h=this.scale.height;
        var pw=w*0.40, ph=h*0.52, px=w/2, py=h/2;
        this.add.rectangle(px,py,w,h,0x000000,0.72);
        this.add.rectangle(px,py,pw,ph,CORES.fundoPanel,0.97);
        var g=this.add.graphics();
        g.lineStyle(1.5,CORES.ciano,0.55);g.strokeRoundedRect(px-pw/2,py-ph/2,pw,ph,14);
        this.add.text(px,py-ph*0.33,'PAUSADO',estiloTitulo(scaleFontSize(Math.round(pw*0.10)))).setOrigin(0.5);
        linhaDecorativa(this,px,py-ph*0.22,pw*0.45);
        var bw=pw*0.72, scene=this;
        criarBotao(this,px,py-ph*0.06,'CONTINUAR',function(){
            scene.scene.stop();
            var mgr=scene.scene.manager;
            var alvo= mgr.isActive('TerceiroAndarScene') ? 'TerceiroAndarScene' :
                      mgr.isActive('QuartoAndarScene')   ? 'QuartoAndarScene'   : 'SegundoAndarScene';
            scene.scene.resume(alvo);
            var c=scene.scene.get(alvo); if(c)c.pausando=false;
        },bw);
        criarBotao(this,px,py+ph*0.20,'SAIR AO MENU',function(){
            scene.scene.stop('PauseScene2');
            scene.scene.stop('SegundoAndarScene');
            scene.scene.stop('TerceiroAndarScene');
            scene.scene.stop('QuartoAndarScene');
            scene.scene.start('MenuScene');
        },bw);
    }
}

// CRÉDITOS
class CreditsScene extends Phaser.Scene {
    constructor() { super({ key: 'CreditsScene' }); }

    create(){
        var w=this.scale.width, h=this.scale.height;
        // Mantém música do menu
        tocarMusica(this, 'menu');
        criarFundoCena(this);
        var pg=this.add.graphics();
        var pts=[];
        for(var i=0;i<28;i++) pts.push({x:Phaser.Math.Between(0,w),y:Phaser.Math.Between(0,h),r:Phaser.Math.FloatBetween(0.6,2),s:Phaser.Math.FloatBetween(0.1,0.4),a:Phaser.Math.FloatBetween(0.1,0.55)});
        this.events.on('update',function(){pg.clear();pts.forEach(function(p){p.y-=p.s;if(p.y<-4)p.y=h+4;pg.fillStyle(CORES.ciano,p.a);pg.fillCircle(p.x,p.y,p.r);});});

        var titulo=this.add.text(w/2,h*0.10,'CRÉDITOS',estiloTitulo(scaleFontSize(55))).setOrigin(0.5).setAlpha(0);
        this.tweens.add({targets:titulo,alpha:1,duration:600,ease:'Power2'});
        linhaDecorativa(this,w/2,h*0.140);
        this.add.text(w/2,h*0.175,'EQUIPE IBM SKILLSBUILD',{fontFamily:'Orbitron',fontSize:scaleFontSize(15.5),color:CORES.cinzaTexto,letterSpacing:6}).setOrigin(0.5);

        var cats=[
            {i:'◈', t:'ARTE',           n:'Samuel Chen  ·  João Pedro Peixoto  ·  William Moraes\nCarolina Jorge  ·  Isabela Coldibella  ·  Pedro Lee'},
            {i:'♪',t:'ÁUDIO',           n:'Samuel Chen  ·  João Pedro Peixoto\n'},
            {i:'⚙',t:'DESENVOLVIMENTO', n:'Samuel Chen  ·  William\nIsabela Coldibella   ·   Enzo Campoi'},
            {i:'</>',t:'PROGRAMAÇÃO',   n:'Enzo Campoi  ·  João Pedro Peixoto\n'},
        ];
        var cw2=w*0.38, ch2=h*0.185;
        var pos=[[w*0.27,h*0.41],[w*0.73,h*0.41],[w*0.27,h*0.635],[w*0.73,h*0.635]];
        var scene=this;
        cats.forEach(function(cat,i){
            var x=pos[i][0], y=pos[i][1];
            var cont=scene.add.container(x,y).setAlpha(0);
            var bg=scene.add.graphics();
            function makeDraw(b){return function(f,brd,a){b.clear();b.fillStyle(f,a);b.fillRoundedRect(-cw2/2,-ch2/2,cw2,ch2,10);b.lineStyle(1.2,brd,0.55);b.strokeRoundedRect(-cw2/2,-ch2/2,cw2,ch2,10);};}
            var draw=makeDraw(bg);
            draw(CORES.fundoPanel,CORES.borda,0.92);
            var acc=scene.add.graphics();
            acc.lineStyle(2,CORES.ciano,0.75);acc.beginPath();acc.moveTo(-cw2*0.38,-ch2/2);acc.lineTo(cw2*0.38,-ch2/2);acc.strokePath();
            cont.add([bg,acc,
                scene.add.text(0,-ch2*0.29,cat.i,{fontFamily:'Orbitron',fontSize:scaleFontSize(40),color:'#00d4ff'}).setOrigin(0.5),
                scene.add.text(0,-ch2*0.05,cat.t,{fontFamily:'Orbitron',fontSize:scaleFontSize(20),fontStyle:'bold',color:'#00d4ff',letterSpacing:2, fontStyle:"bold"}).setOrigin(0.5),
                scene.add.text(0,ch2*0.27,cat.n,{fontFamily:'Orbitron',fontSize:scaleFontSize(15.5),color:'#E6F4FF', align:'center',lineSpacing:9}).setOrigin(0.5),
            ]);
            scene.tweens.add({targets:cont,alpha:1,delay:280+i*110,duration:400,ease:'Power2'});
            var z=scene.add.zone(x,y,cw2,ch2).setInteractive();
            z.on('pointerover',function(){scene.tweens.add({targets:cont,scaleX:1.02,scaleY:1.02,duration:140});draw(CORES.fundoBotaoHov,CORES.ciano,0.88);});
            z.on('pointerout', function(){scene.tweens.add({targets:cont,scaleX:1,scaleY:1,duration:140});draw(CORES.fundoPanel,CORES.borda,0.92);});
        });

        this.add.text(w/2,h*0.875,'2026  —  T29 Grupo 2  |  Thinker Journey',{fontFamily:'Orbitron',fontSize:scaleFontSize(11.5),color:CORES.cinzaTexto}).setOrigin(0.5).setAlpha(0.6);
        criarBotao(this,w/2,h*0.935,'VOLTAR',function(){scene.scene.start('MenuScene');},200);
    }
}

// PHASER CONFIG
var config = {
    type: Phaser.AUTO,
    width:  Math.round(window.innerWidth  * 0.92),
    height: Math.round(window.innerHeight * 0.90),
    parent: 'game-container',
    audio: { disableWebAudio: false },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false },
    },
    scene: [
        MenuScene,
        ConfigScene,
        TutorialScene,
        IntroScene,
        GameScene,
        ElevatorScene,
        PrimeiroAndarScene,
        MinigameDragDrop1Scene,
        SegundoAndarScene,
        MinigameMLScene,
        MinigameBossScene,
        TerceiroAndarScene,
        Cutscene3Andar,
        MinigameConexoesScene,
        QuartoAndarScene,
        MinigameFilesScene,
        CutsceneCidade,
        Cutscene4Andar,
        PauseScene,
        PauseScene2,
        CreditsScene,
    ],
};

var game = new Phaser.Game(config);

window.addEventListener('resize', function() {
    game.scale.resize(
        Math.round(window.innerWidth  * 0.92),
        Math.round(window.innerHeight * 0.90)
    );
});