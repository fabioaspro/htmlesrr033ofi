import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { PoModule, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoAccordionModule, PoUploadComponent, PoModalComponent, PoInputComponent, PoAccordionItemComponent, PoUploadLiterals, PoLookupColumn, PoLoadingModule } from '@po-ui/ng-components';
import { ServerTotvsService } from '../services/server-totvs.service';
import { ExcelService } from '../services/excel-service.service';
//import { escape } from 'querystring';
import { TecLabLookupService } from '../services/header-lookup.service';
import { BtnDownloadComponent } from '../btn-download/btn-download.component';

@Component({
  selector: 'app-tela',
  standalone: true,
  imports: [
    CommonModule,
    PoAccordionModule,
    BtnDownloadComponent,
    ReactiveFormsModule,
    FormsModule,
    PoModalModule,
    PoTableModule,
    PoModule,
    PoFieldModule,
    PoDividerModule,
    PoButtonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    HttpClientModule
  ],
  templateUrl: './tela.component.html',
  styleUrl: './tela.component.css'
})


export class TelaComponent {

  private srvheader = inject(TecLabLookupService)
  private srvTotvs = inject(ServerTotvsService);
  private srvNotification = inject(PoNotificationService);
  private srvExcel = inject(ExcelService);
  private srvDialog = inject(PoDialogService);
  private router = inject(Router);
  private formImport = inject(FormBuilder);
  private formB = inject(FormBuilder);

  //Variaveis
  mensagemPedido: any[] = []
  pedidosGerados: any[] = []
  ultimoPedido!: string
  listaEstabelecimentos: any[] = []
  placeHolderEstabelecimento!: string
  itemSelecionado: any = null
  lPendente: boolean = true
  lEnviado: boolean = true
  
  labelLoadGeral: string = ''
  loadGeral: boolean = false

  labelLoadTela: string = ''
  loadTela: boolean = false
  loadDadosItens: boolean = false
  loadExcel: boolean = false
  mudaCampos!: number | null
  pesquisa!: string
  lBotao:  boolean = true
  lPaleta: boolean = true
  lPaletaC:boolean = true
  alturaGrid: number = window.innerHeight - 540 //Grid de Zoom
  objSelecionado: any
  lDisable: boolean = false
  total = 0
  cFilialOrigem!: string
  cNomeOrigem!: string
  EmitenteService = this.srvheader
  codigoEmitente!: number

  //Controle do Log de Arquivos
  mostrarDados: boolean = false;
  listaArquivos!: any[];
  colunasArquivos!: PoTableColumn[];

  //paginação do grid
  itensPaginados = []
  page = 1
  pageSize = 20
  disableShowMore = false

  _ambiente = ""

  //tituloTela!: string
  //dtIni: string = ''
  //dtFim: string = ''
  //nomeBotao: any;
  //alturaGridRPD: number = window.innerHeight - this.alturaGrid - 700
  //alturaError: number = window.innerHeight - this.alturaGrid - 290
  //idBatch!: number | null 
  //_url!: PoLookupFilter
  //_url = this.srvTotvs.ObterTecLab()
  //headersTotvs = environment.headersTotvsI


  //Filtros Avançados
  filtro = {

    valEstabIni: "",
    valEstabFim: "ZZZ",
    cLabelCodEstabel: "Estabelecimento",

    valSerieIni: "",
    valSerieFim: "ZZZ",
    cLabelSerie: "Série",

    valOsDoctoIni: "0",
    valOsDoctoFim: "9999999",
    cLabelOsDocto: "OS/Nota",

    valItemIni: "",
    valItemFim: "ZZZZZZZZZZZZZZZZ",
    cLabelItem: "Item",

    valEncIni: "0",
    valEncFim: "999999999999",
    cLabelEnc: 'ENC'
  }

  //relacionamentos
  @ViewChild('poTable') poTable!: PoTableComponent;
  @ViewChild('upload') poUpload!: PoUploadComponent;
  @ViewChild('ttDadosConc') GridConclusao!: PoTableComponent;
  //@ViewChild('telaAdicionais', { static: true }) telaAdicionais:  | PoModalComponent  | undefined;
  @ViewChild('telaAdicionais') telaAdicionais!: PoModalComponent;
  @ViewChild('telaFiltroAvancado', { static: true }) telaFiltroAvancado: | PoModalComponent | undefined;
  @ViewChild('cScan') cScanInput: PoInputComponent | undefined;
  @ViewChild('cEstabel') cEstabelInput: PoInputComponent | undefined;
  @ViewChild('dconclusao') dconclusao!: PoAccordionItemComponent;
  @ViewChild('dreparo1') dreparo!: PoAccordionItemComponent;
  @ViewChild('dreparo2') dreparo2!: PoAccordionItemComponent;
  @ViewChild('dreparo3') dreparo3!: PoAccordionItemComponent;
  @ViewChild('logArquivo') logArquivo!: PoAccordionItemComponent;
  @ViewChild(PoAccordionItemComponent, { static: true }) dreparo1!: PoAccordionItemComponent;
  @ViewChild(PoAccordionItemComponent, { static: true }) dconclusao1!: PoAccordionItemComponent;

  //---Grid
  colunas!: PoTableColumn[]
  lista: any[] = []
  itCodigo!: any

  colunasItens!: PoTableColumn[]
  listaItens!: any[]

  dtAtual!: Date
  hrAtual!: any
  hrFim!: any

  customLiteralsupload: PoUploadLiterals = {
    dragFilesHere: 'Arraste o Arquivo aqui',
    selectFilesOnComputer: 'ou selecione o Arquivo no seu Computador',
    sentWithSuccess: 'Arquivo enviado com sucesso',
    startSending: 'Enviando Arquivo',
    errorOccurred: 'Erro',
    selectFile: 'Buscar arquivo',
  };

  customLiterals: PoTableLiterals = {
    noData: 'Informe os filtros para Buscar os Dados',
    loadMoreData: 'Carregar mais',
    loadingData: 'Buscar '
  };


  public readonly columnsTecLab: Array<PoLookupColumn> = [
    { property: 'nickname', label: 'Hero' },
    { property: 'name', label: 'Name' }
  ];
  //Formulario
  /*public form = this.formImport.group({
    //let hoje = new Date()
    //let toDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    
    dtIni: ['', Validators.required],
    dtFim: ['', Validators.required],
    //dtFim: ['2025-04-16', Validators.required],
    //dtIni: new FormControl(new Date(new Date().setDate(new Date().getDate() - 30))),
    //dtFim: new FormControl(new Date(new Date().setDate(new Date().getDate()))),
    cIntegra: ['Todas as Integrações', Validators.required],
    lPendente: new FormControl(true), //Marca inicial como True
    lEnviado:  new FormControl(false)
  });*/

  //Formulario
  public form = this.formImport.group({
    codEstabel: [''],
    codFilial: [''],
    numRR: [''],
    cScan: [''],
    tpBusca: [2],
    aux: ['']
  });

  public formEmit = this.formImport.group({
    codEmitente: ['']
  });

  public formOrig = this.formImport.group({
    codOrigem: ['']
  });

  public formAdicionais = this.formImport.group({
    cObs: [''],
    cPrioridade: ['D0'],
    aux: ['']
  })

  public formAltera = this.formB.group({
    "codEstabel": [0, Validators.required],
    "codFilial": [0, Validators.required],
    "numRR": [0, Validators.required],
    "numSerieIt": [0, Validators.required],
    "NumOS": [0, Validators.required],
    "Chamado": [0, Validators.required],
    "DataRecebe": [0, Validators.required],
    "HoraRecebe": [0, Validators.required],
    "itCodigo": [0, Validators.required],
    "descItem": [0, Validators.required],
    "camporpd": [0, Validators.required],
    "DefInd": [0, Validators.required],
    "descDefInd": [0, Validators.required],
    "nTecnico": [0, Validators.required],
    "descTec": [0, Validators.required],
    "Lab": [0, Validators.required],
    "Sit": [0, Validators.required],
    "Bloq": [0, Validators.required],
    "Obs": [0, Validators.required],
  });

  /*
  fieldFormat(value: any) {
    return `${value.CodEmitente} - ${value.NomeAbrev}`;
  }*/


  //------------------------------------------------------------ Change Emitente - Popular Emitente
  public onEmitChange(obj: string) {

    if (obj === undefined) return


    /*
    //Popular o Combo do Emitente
    this.listaTecnicos = []
    this.codTecnico= ''
    this.listaTecnicos.length = 0;
    this.loadTecnico = `Populando técnicos do estab ${obj} ...`

    this.codEstabelecimento = obj

    this.srvTotvs
      .ObterEmitentesDoEstabelecimento(obj).subscribe({
        next: (response:any) => {
            delay(200)         
            this.listaTecnicos = response
            this.loadTecnico = 'Selecione o técnico'
        },
      // error: (e) => this.srvNotification.error("Ocorreu um erro na requisição " ),
      });
    */
  }

  //CONCLUSAO DE REPARO
  ngOnInit(): void {

    this.loadGeral      = false
    this.labelLoadGeral = "Inicializando Dados"
    
    this.form.disable()
    this.formEmit.get("codEmitente")?.disable()

    this.srvTotvs.ObterUsuario().subscribe({
      next: (data: any) => {
        
        let paramsUser: any = { cUsuario: data.cUsuario }
        this.srvTotvs.ObterFilialOrigem(paramsUser).subscribe({
          next: (data: any) => {
            
            this.listaEstabelecimentos = []
            this.listaEstabelecimentos = (data as any[]).sort(this.srvTotvs.ordenarCampos(['value']))
            this.placeHolderEstabelecimento = 'Selecione uma Filial de Origem'
            this.listaEstabelecimentos = data
            
            this.loadGeral = true
          },
          error: (error: any) => {
            this.loadGeral = true
            this.srvNotification.error("Ocorreu um erro ao Obter Filial:" + error)

          },
          complete: () => { }
        })
        
      },
      error: (error: any) => {
        this.loadTela = false
        this.srvNotification.error("Ocorreu um erro ao Obter Usuário:" + error)
        this.form.disable()
        this.formEmit.get("codEmitente")?.disable()
      },
      complete: () => { }
    })    

    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunasZoom()
    this.colunasArquivos = this.srvTotvs.obterColunasArquivos()
    this.desabilitaFormRPD()

    this.mudaCampos = 1 //iniciar a variavel
    this.form.controls['tpBusca'].setValue(this.mudaCampos)
    this.onChangetpBusca(this.mudaCampos)

    this.dreparo1.expand()
    this.dconclusao1.expand()

    setTimeout(() => {
      this.dreparo.expanded  = true
      this.dreparo2.expanded = true
      //this.dreparo3.expanded   = true
      this.dconclusao.expanded = true
      this.logArquivo.expanded = true
    }, 500)

    //this.arquivoInfoOS = item.items[0].nomeArquivo;

  }

  public onEmitenteChange (obj: string){
    this.form.enable()
    this.lBotao  = false
    this.lPaleta = false
  }

  public onFilialOrigemChange (obj: string){

    this.cFilialOrigem = obj
    this.loadTela = false
    
    this.formEmit.get("codEmitente")?.enable()
    
    this.formOrig.get("codOrigem")?.disable()
    this.form.disable()
    this.lPaletaC = false //esse habilita/desabilita botão cancelar pedido
  }

  //Log de Arquivo
  public ngarquivo() {

    /*
    //2425018
    let paramsArquivo: any = {
          iExecucao: 2,
          //cRowId: this.listaOrdens[0]['c-rowId'],
        };
    this.srvTotvs.ImprimirOS(paramsArquivo).subscribe({
      next: (response: any) => {

        //Acompanhar rpw
        this.numPedExec.update(() => response.NumPedExec)

        //Arquivo Gerado
        let params: any = { nrProcess: this.nrProcesso, situacao: 'IOS' };
        this.srvTotvs46.ObterArquivo(params).subscribe({
          next: (item: any) => {
            this.listaArquivos = item.items;
            this.arquivoInfoOS = item.items[0].nomeArquivo;
            }
          });

        this.loadTela = false;
        this.srvTotvs.EmitirParametros({ processoSituacao: 'IMPRESSO' });
      },
      error: (e) => {
        this.loadTela = false;
      },
    });
    */
  }

  public FechartelaAdicionais(): void {

    this.telaAdicionais.close()

  }

  public desabilitaFormRPD() {

    //this.formRPD.disable()

  }

  public habilitaFormRPD() {

    //this.formRPD.enable()

  }

  ImprPed(){

    this.router.navigate(['tela-impr-ped'])

  }

  onEnter(event: Event){
    event.preventDefault()
    if (document.activeElement?.tagName === 'INPUT'){
       this.ChamaObterDadosReparo()
    }
    else {}
  }
  ChamaObterDadosReparo() {

    this.formAltera.reset()
    this.ultimoPedido = ""
    this.listaArquivos = []
    
    //valida se foi selecionado o emitente
    if (!this.formEmit.get("codEmitente")?.value) {
      this.srvNotification.error("Emitente deve ser selecionado ! : " + this.formEmit.controls['codEmitente'].value)
      return
    }

    if (this.form.controls['cScan']?.value === null) {

      const validaReparo = this.lista.some(r => r.codEstabel === this.form.controls['codEstabel'].value)
      if (validaReparo) {
        const validaReparo = this.lista.some(r => r.codFilial === this.form.controls['codFilial'].value)
        if (validaReparo) {
          const validaReparo = this.lista.some(r => r.numRR === this.form.controls['numRR'].value)
          if (validaReparo) {
            this.srvNotification.error("Reparo já lido: " + this.form.controls['numRR'].value)
            return
          }
        }
      }
    }

    //Valida se reparo já foi incluido
    const validaReparo = this.lista.some(r => r.cScan === this.form.controls['cScan'].value)

    if (validaReparo) {
      this.srvNotification.error("Reparo já lido: " + this.form.controls['cScan'].value)
      return
    }

    this.formEmit.get("codEmitente")?.disable()
    this.labelLoadTela = "Procurando Reparo"

    this.loadTela = true
    this.loadDadosItens = true
    this.lBotao = true

    //fas comentado para nao dar erro dando enter no botão
    //this.onChangetpBusca(0)
    // comentado para tratar certo o campo
    // this.mudaCampos = this.form.controls['tpBusca'].value

    let paramsTela: any = { codEstabel: this.formOrig.value, codEmitente: this.formEmit.value, items: this.form.value, listaRep: this.lista }

    //console.log (paramsTela)
    //Chamar o servico
    this.srvTotvs.ObterDadosReparo(paramsTela).subscribe({
      next: (response: any) => {

        this.formAltera.patchValue(response.items[0])

        this.loadTela = false
        this.loadDadosItens = false

        this.lista = [...this.lista, ...response.zoom]

        this.total = this.lista.length //recalcula total incluídos

        this.listaItens = response.itensrpd
        
        if (response.zoom[0].termGarantia.trim() !== "") {
          this.srvDialog.alert({
            title: "ITEM em Garantia",
            message: response.zoom[0].termGarantia
          });
        }

        //this.form.disable()
        this.lBotao   = false //esse habilita/desabilita botão Carregar
        this.lPaleta  = false //esse habilita/desabilita botão gerar pedido
        this.lPaletaC = false //esse habilita/desabilita botão cancelar pedido

        this.habilitaFormRPD()

        this.form.reset()
        this.form.controls['tpBusca'].setValue(this.mudaCampos)

        this.dreparo1.expanded = true
        this.dreparo2.expanded = true
        //this.dreparo3.expanded = true
        this.dconclusao.expanded = true
        this.logArquivo.expanded = true
      },
      error: (e) => {
        //this.srvNotification.error('Ocorreu um erro ao ObterDadosReparo: ' + e.error.message)
        this.form.reset()

        this.loadTela = false
        this.loadDadosItens = false
        this.lBotao  = false //esse habilita/desabilita botão Carregar
        this.lPaleta = false //esse habilita/desabilita botão  gerar pedido
        this.lPaletaC = false //esse habilita/desabilita botão cancelar pedido
        this.desabilitaFormRPD()
        this.habilitaFormRPD()
         
        this.form.controls['tpBusca'].setValue(this.mudaCampos)
      },
    })

  }

  changeBusca(event: any) {
    //Procedure quando muda o Tipo de Busca

    let cEmitenteTela = this.formEmit.controls['codEmitente'].value //grava valor anterior na variavel
    //this.lista = [] //limpa a lista
    this.form.controls['tpBusca'].setValue(event)


    //alert (this.form.controls['tpBusca'].value)

    this.mudaCampos = this.form.controls['tpBusca'].value

    this.form.reset()

    if (this.form.controls['tpBusca'].value == 1) { //Item
      this.pesquisa = "COD.BARRAS " //+ this.form.controls['itCodigo'].value
    }
    else {
      this.pesquisa = "REPARO " //+ this.form.controls['codEstabel'].value + ' - '+ this.form.controls['codFilial'].value + ' - ' + this.form.controls['numRR'].value
    }

    this.formEmit.controls['codEmitente'].setValue(cEmitenteTela) //retorna valor ao campo

  }

  changeOptions(event: any): void {
    //if(event.idBatch !== null){
    //  this.ChamaObterDadosErrorEsaa052(event.idBatch) //1
    //}
    //else {
    //}
    /*
    if (type === 'new') {
      //this.itemsSelected.push({
      //  id: event.id,
      //  label: event.label,
      //  email: event.email
      });
      //this.itemsSelected = [...this.itemsSelected];
    } else {
      //const index = this.itemsSelected.findIndex(el => el.id === event.id);
      //this.poItemsSelected.removeItem(index);
      //this.itemsSelected = [...this.poItemsSelected.items];
    }
      */
  }

  onChangetpBusca(event: any) {

    if (this.mudaCampos == 1) {
      this.mudaCampos = 1
      setTimeout(() => this.cScanInput?.focus(), 0)
    }
    else {
      this.mudaCampos = 2
      setTimeout(() => this.cEstabelInput?.focus(), 0)
    }

  }

  resetTela() {
    this.listaArquivos = []
    this.lista         = []
    this.listaItens    = []

    this.lBotao   = true
    this.lPaleta  = true
    this.lPaletaC = true
    
    this.formAltera.reset()
    this.form.reset()
    
    
    
    this.mudaCampos = 1 //iniciar a variavel
    this.form.controls['tpBusca'].setValue(this.mudaCampos)
    this.onChangetpBusca(this.mudaCampos)
    this.formEmit.controls['codEmitente'].setValue("")
    this.form.get("codEmitente")?.disable()
    this.total = this.lista.length //recalcula total incluídos
    this.formOrig.controls['codOrigem'].setValue("")
    this.formEmit.disable()
    this.form.disable()

    this.lPaletaC = true
    this.formOrig.get("codOrigem")?.enable()
    
  }
  onCancelar() {

    this.srvDialog.confirm({
      title: 'Cancelar Envio de Reparos',
      message: 'Deseja realmente cancelar o Envio de Reparos ?',

      confirm: () => {
        this.resetTela()
        this.srvNotification.success('Envio de Reparos Cancelado')
      },
      cancel: () => { }
    })

  }

  onConcluir() {

    //console.log(this.lista.length)
    if (this.lista.length === 0) {
      this.srvNotification.error('Nenhum reparo foi incluido')
    }
    else {
      this.srvDialog.confirm({
        title: 'Implantação de Pedido',
        message: 'Deseja confirmar a criação do Pedido ?',

        confirm: () => {

          this.telaAdicionais?.open()

        },
        cancel: () => { }
      })
    }
  }

  public ChamaGerarPedido(): void {

    if (this.formAdicionais.controls['cPrioridade'].value === "") {
      this.srvNotification.error('Prioridade deve ser informada !!')
    }
    else {

      this.telaAdicionais.close()
      this.labelLoadTela = "Gerando Pedidos"
      this.loadTela = true

      //Passando os parametros de técnicos selecionados
      let params = {
        cCodEmitente: this.formEmit.controls['codEmitente'].value,
        cObservacao: this.formAdicionais.controls['cObs'].value,
        cPrioridade: this.formAdicionais.controls['cPrioridade'].value,
        items: this.lista
      };

      //Chamar a api para processar registros
      this.srvTotvs.EfetivarPedido(params).subscribe({
        next: (data: any) => {
          this.labelLoadTela = "Gerando Pedidos"
          this.loadTela = true
          this.mensagemPedido = data.items
          this.ultimoPedido = data.nrpedido
          
          this.pedidosGerados = data.pedGerados

        },
        error: (e: any) => {

          this.loadTela = false
          //mensagem pro usuario
          //this.Pnotifica.error("Erro ao chamar ExecEntradas.:" + e)
        },

        complete: () => {

          this.loadTela = false
          this.srvNotification.success("" + this.mensagemPedido) //Foi Gerado o Pedido com sucesso
          //this.atualizar();

          //Abaixo roda se der tudo OK
          this.telaAdicionais.close()
          this.resetTela()

          //Lista os Arquivos dos Pedidos Gerados  
          this.listaArquivos = []
    
          //Arquivos Gerados
          this.pedidosGerados.forEach((item) => { 
            
            this.obterarq(item["nrPedido"])

          })

        }
      })

    }

  }

  public obterarq(numPed: string) {

    //Esta fazendo fora 
    //this.listaArquivos = []
    
    //Arquivo Gerado
    let paramsArq: any = { nrProcess: numPed, situacao: 'IPED' };
    this.srvTotvs.ObterArquivo(paramsArq).subscribe({
      next: (item: any) => {

        this.listaArquivos = [...this.listaArquivos, ...item?.items]

      },
      error: (e: any) => {
        //mensagem pro usuario
        //this.Pnotifica.error("Erro ao chamar ExecEntradas.:" + e)
      }

    })

  }

  getNomeCampo(campo: string) {
    const nomes: any = {

      TecLab: 'Técnico LAB',
      DtIniRep: 'Data Ini Rep',
      HrIniRep: 'Hora Ini Rep',
      HrFimRep: "Hora Fim Rep",
      DefC: "Defeito Const",
      Causa: "Causa",
      Sol1: "Solução 1",
      Sol2: "Solução 2",
    }
    return nomes[campo] || campo

  }

  //Funcao 
  public DtHrAtual() {
    let hoje = new Date()
    let hora = hoje.getHours()
    let minu = hoje.getMinutes()
    let toDate = new Date()

    this.dtAtual = toDate;

    this.hrAtual = `${hora}:${minu}`
    this.hrFim = `${hora}:${minu + 1}`
  }

  /*
  changeOptions(event, type): void {
    if (type === 'new') {
      this.itemsSelected.push({
        id: event.id,
        label: event.label,
        email: event.email
      });
      this.itemsSelected = [...this.itemsSelected];
    } else {
      const index = this.itemsSelected.findIndex(el => el.id === event.id);
      this.poItemsSelected.removeItem(index);
      this.itemsSelected = [...this.poItemsSelected.items];
    }
  }*/





  //--- Actions
  readonly opcoes: PoTableAction[] = [
    {
      label: 'Editar',
      icon: 'bi bi-pencil-square',
      action: this.onEditar.bind(this),
    },
    {
      separator: true,
      label: 'Deletar',
      icon: 'bi bi-trash',
      action: this.onDeletar.bind(this),
      type: 'danger'
    }];



  readonly acaoSalvar: PoModalAction = {
    label: 'Salvar',
    action: () => { this.onSalvar() }
  }

  readonly acaoCancelar: PoModalAction = {
    label: 'Cancelar',
    action: () => { //this.cadModal?.close()
    }
  }
  formBuilder: any;
  nomeEstabel: string | undefined;
  valorForm: any;

  onConsultaEnc() {

    this.router.navigate(['tela-enc'])
  }

  leaveCampo(nomeCampo: string) {

    /*
    const valorTecLab = this.formRPD.get(nomeCampo)?.value

    let paramsTela: any = {items: { cCampo: `${nomeCampo}`, cValor: valorTecLab }}
    
    //Chamar o servico
    this.srvTotvs.ObterLeave(paramsTela).subscribe({
      next: (response: any) => {        

          this.formRPD.controls['descTec'].setValue(response.cLeave)
      },
      error: (e) => {
        
      },
    })
    */
  }

  ChamaObterDadosErrorEsaa052(iId: any) {

    this.loadDadosItens = true
    this.desabilitaFormRPD()
    let paramsID: any = { items: { idBatch: iId } }

    //Chamar o servico

    this.srvTotvs.ObterDadosErrorEsaa052(paramsID).subscribe({
      next: (response: any) => {
        //this.srvNotification.success('Erros listados com sucesso !')
        this.loadDadosItens = false
        this.listaItens = response.items
        //this.listaError.sort(this.srvTotvs.ordenarCampos(['idBatch']))        

        this.habilitaFormRPD()
      },
      error: (e) => {
        this.srvNotification.error('Ocorreu um erro ObterDados: ' + e)
        this.loadDadosItens = false
        this.habilitaFormRPD()
      },
    })
  }

  ChamaObterDadosEsaa052() {

    this.labelLoadTela = "Carregando Dados..."
    this.loadTela = true
    this.habilitaFormRPD()
    let paramsTela: any = { items: this.form.value }

    //Chamar o servico
    this.srvTotvs.ObterDadosEsaa052(paramsTela).subscribe({
      next: (response: any) => {
        //this.srvNotification.success('Dados listados com sucesso !')
        this.total = response.items.length
        this.lista = response.items
        this.lista.sort(this.srvTotvs.ordenarCampos(['DtHrInc']))
        this.loadTela = false
        this.habilitaFormRPD()
        this.ChamaObterDadosErrorEsaa052(this.lista[0].idBatch)
      },
      error: (e) => {
        //this.srvNotification.error('Ocorreu um erro ObterDados: ' + e)
        this.loadTela = false
        this.habilitaFormRPD()
      },
    })
  }

  OnSeleciona(event: any): void { }


  onOracle() {

    this.router.navigate(['tela-oracle'])

  }

  selecionarItem(item: any) {

    this.itemSelecionado = item
  }

  ExcluirSelecionado() {

    if (!this.itemSelecionado) return
    this.srvDialog.confirm({
      title: 'Confirmar Exclusão',
      message: 'Deseja realmente excluir esta linha ?',

      confirm: () => {
        this.lista = this.lista.filter(item => item !== this.itemSelecionado)
        this.itemSelecionado = null
        this.total = this.lista.length //recalcula total incluídos

        this.formAltera.reset()
        this.srvNotification.success('Registro eliminado com sucesso')
      },
      cancel: () => { }
    })
  }

  // Método para selecionar programaticamente uma linha
  selecionarLinhaold(id: number) {
    const item = this.lista.find(i => i.ltFilial === id); // Localiza o item pelo ID
    if (item) {
      this.poTable.selectRowItem(item); // Seleciona o item na tabela
    }
    else {
      alert("error")
    }
  }

  onCustomActionClick(file: any) {
    console.log(file)
  }

  onObterArquivo() {

    this.labelLoadTela = "Carregando Arquivo..."
    this.loadTela = true
    //let paramsTela: any = { items: this.form.value }
    this.lista = []
    //Chamar o servico
    this.srvTotvs.ObterArquivo().subscribe({
      next: (response: any) => {
        this.srvNotification.success('Dados listados com sucesso !')
        this.lista = response.items
        this.poUpload.clear()
        this.lista.sort(this.srvTotvs.ordenarCampos(['iLinha']))
        this.lDisable = false
        this.loadTela = false

      },
      error: (e) => {
        this.srvNotification.error('Ocorreu um erro ObterArquivo: ' + e)
        this.loadTela = false
      },
    })
  }

  onChamaUpload() {

    //Chamar o servico
    this.srvTotvs.EfetivarArquivo().subscribe({
      next: (response: any) => {
        this.srvNotification.success('Arquivo Importado com sucesso !')

        this.lista = response.items
        this.poUpload.clear()
        //this.lista = []
        this.loadTela = false

      },
      error: (e) => {
        this.srvNotification.error('Ocorreu um erro EfetivarArquivo: ' + e)
        this.loadTela = false
      },
    })

  }

  ChamaUploadOk(response: any) {

    this.srvNotification.success('Dados Carregados com sucesso !')

  }

  ChamaErro(event: any) {

    this.srvNotification.error("Erro ao Carregar o Arquivo ! ")

  }

  ChamaSucesso(response: any) {

    this.srvNotification.success('Arquivo Importado com sucesso ! : ')
    this.lista = response.items

  }

  onEfetivarArquivo() {

    //Pega os registros selecionados
    let registrosSelecionados = this.GridConclusao.getSelectedRows()

    if (this.GridConclusao.getSelectedRows().length > 0) {

      this.loadTela = true
      this.labelLoadTela = "Efetivando Arquivo..."

      //Dialog solicitando confirmacao de processamento
      this.srvDialog.confirm({

        title: 'Efetivar Importação?',
        message: 'Efetivar a Importação dos Dados do Arquivo ? ',
        literals: { cancel: 'Cancelar', confirm: 'Efetivar' },

        //Caso afirmativo
        confirm: () => {

          this.labelLoadTela = "Efetivando Arquivo..."
          this.loadTela = true

          let params: any = { items: registrosSelecionados }

          //Chamar o servico
          this.srvTotvs.EfetivarArquivo(params).subscribe({
            next: (response: any) => {
              this.srvNotification.success('Dados importados com sucesso !')
              this.lista = response.items
              this.poUpload.clear()
              this.loadTela = false
              this.lDisable = true
            },
            error: (e) => {
              this.srvNotification.error('Ocorreu um erro EfetivarArquivo: ' + e)
              this.loadTela = false
            },
          })
        },

        //Caso cancelado notificar usuario
        cancel: () => {

          this.loadTela = false
          this.srvNotification.error('Cancelado pelo usuario')

        }

      });

    }
    //Nenhum Registro selecionado no grid
    else this.srvNotification.error('Nenhum registro selecionado !');

  }

  //Detalhes do Grid
  onAlterarGrid(obj: any) {
    this.objSelecionado = obj
    this.telaAdicionais?.open()
  }
  readonly acaoAlterarLinha: PoModalAction = {
    label: 'Salvar',
    action: () => {
      //this.alterarOrdem()
    },

    disabled: !this.formAltera.valid,
  };

  readonly acaoCancelarLinha: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaAdicionais?.close();
    },
  };

  //Filtro Avançado
  onFiltroAvancado() {
    this.telaFiltroAvancado?.open()
  }

  readonly acaoConfirmarFiltro: PoModalAction = {
    label: 'Aplicar',
    action: () => {
      this.telaFiltroAvancado?.close()
      //this.ChamaObterDadosPagEsaa052()
    },

    disabled: !this.formAltera.valid,
  };

  readonly acaoCancelarFiltro: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaFiltroAvancado?.close();
    },
  };

  onAtualizar() {

    this.loadTela = true
    this.lista = []
    this.poUpload.clear()
    this.loadTela = false
    this.lDisable = false

  }

  /*changeBusca(event: any) {

    this.lista = []
    this.form.controls['tpBusca'].setValue(event)

    //alert (this.form.controls['tpBusca'].value)

    this.mudaCampos = this.form.controls['tpBusca'].value

    if (this.form.controls['tpBusca'].value == 1) { //Item
      this.form.reset()
      this.pesquisa = "ITEM " //+ this.form.controls['itCodigo'].value
    }
    else {
      this.form.reset()
      this.pesquisa = "REPARO " //+ this.form.controls['codEstabel'].value + ' - '+ this.form.controls['codFilial'].value + ' - ' + this.form.controls['numRR'].value
    }

  }*/



  /*public habilitaForm() {

    this.lBotao = false
    this.form.controls['tpBusca'].enable()

    this.form.controls['codEstabel'].enable()
    this.form.controls['codFilial'].enable()
    this.form.controls['numRR'].enable()
    this.form.controls['itCodigo'].enable()
  }

  public desabilitaForm() {

    this.lBotao = true
    this.form.controls['tpBusca'].disable()

    this.form.controls['codEstabel'].disable()
    this.form.controls['codFilial'].disable()
    this.form.controls['numRR'].disable()
    this.form.controls['itCodigo'].disable()
  }*/
  //---------------------------------------------------------------- Exportar lista detalhe para excel
  public onExportarExcel() {
    let titulo = "IMPORTAÇÃO DE DADOS DO ITEM" //this.tituloTela.split(':')[0]
    let subTitulo = "DADOS DO ITEM" //this.tituloTela.split(':')[1]
    this.loadExcel = true

    //let valorForm: any = { valorForm: this.form.value }

    this.srvExcel.exportarParaExcel('IMPORTAÇÃO DE DADOS: ' + titulo.toUpperCase(),
      subTitulo.toUpperCase(),
      this.colunas,
      this.lista,
      'Import_Itens',
      'Plan1')

    this.loadExcel = false;
  }
  //---Listar registros grid
  listar() {
    this.loadTela = true;

    this.srvTotvs.Obter().subscribe({
      next: (response: any) => {
        if (response === null) return

        this.lista = response.items
        this.loadTela = false
      },
      error: (e) => {
        //this.srvNotification.error('Ocorreu um erro na requisição')
        this.srvNotification.error("Erro ao chamar Obter Lista:" + e)
        this.loadTela = false
      },
    });
  }

  //Chama tela do TOTVS
  public AbrirTelaTOTVS(programa: string): void {
    let params: any = { program: programa, params: '' };
    this.srvTotvs.AbrirTelaTOTVS(params).subscribe({
      next: (response: any) => { },
      error: (e) => {
        this.loadTela = false;
        //mensagem pro usuario
        this.srvNotification.error("Erro ao chamar AbrirTelaTOTV:" + e)
      },
    });
  }

  //---Novo registro
  onNovo() {

    //Criar um registro novo passando 0 o ID
    this.router.navigate(['form/0'])

  }

  //---Editar registro
  onEditar(obj: any | null) {

    //Criar um registro novo passando 0 o ID

    this.router.navigate(['form/' + obj.codEstabel])

  }

  //---Deletar registro
  onDeletar(obj: any | null) {
    let paramTela: any = { codEstabel: obj.codEstabel }

    this.srvDialog.confirm({
      title: "DELETAR REGISTRO",
      message: `Confirma deleção do registro: ${obj.nomeEstabel} ?`,
      confirm: () => {
        this.loadTela = true
        this.srvTotvs.Deletar(paramTela).subscribe({
          next: (response: any) => {
            this.srvNotification.success('Registro eliminado com sucesso')
            this.listar()
          },
          // error: (e) => this.srvNotification.error('Ocorreu um erro na requisição'),
        })
      },
      cancel: () => this.srvNotification.error("Cancelada pelo usuário")
    })
  }

  //---Salvar Registro
  onSalvar() {


  }

  ChamaUpload1() {
    this.labelLoadTela = "Calculando Prioridade"
    this.loadTela = true
    this.loadTela = false


    /*
    this.desabilitaForm()
    let paramsTela: any = { items: this.form.value }
    //console.log(paramsTela)
    this.lista = []

     
    if (this.mudaCampos == 1) { //Item
      this.pesquisa = "ITEM " //+ this.form.controls['itCodigo'].value
    }
    else{
      this.pesquisa = "REPARO " // + this.form.controls['codEstabel'].value + ' - '+ this.form.controls['codFilial'].value + ' - ' + this.form.controls['numRR'].value
    }
    //Chamar o servico
    this.srvTotvs.ObterBRR(paramsTela).subscribe({
      next: (response: any) => {
        this.srvNotification.success('Dados listados com sucesso !')
        this.lista = response.items
        this.lista.sort(this.srvTotvs.ordenarCampos(['iOrdem']))
        
        this.loadTela = false
        this.habilitaForm()
      },
      error: (e) => {
        //this.srvNotification.error('Ocorreu um erro ObterBRR: ' + e)
        this.loadTela = false
        this.habilitaForm()
      },
    }) 
      */
  }

}