import type { IServiceOrdersApi } from './api';
import type {
  ServiceOrder,
  CreateOSPayload,
  TransitionPayload,
  WhatsAppNotification,
  AuditLogEntry,
} from '../../lib/types';
import { getMaloteForStore } from '../../lib/constants';
import { uid, generateOSNumber } from '../../lib/utils';

const STORAGE_KEY = 'oc_v9_service_orders';
const NOTIF_STORAGE_KEY = 'oc_v9_notifications';

// Generates a mock list of service orders
function getInitialSeedData(): ServiceOrder[] {
  const now = new Date();
  
  const mockOrders: Partial<ServiceOrder>[] = [
    {
      id: 'os_1',
      osNumber: 'OC260707-0001',
      osStore: '100150',
      sequence: '001',
      clientName: 'João da Silva',
      clientPhone: '(21) 98765-4321',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Chegada de Malote',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      prescription: {
        od: { esf: '+1.50', cil: '-0.50', eixo: '180', add: '+2.00', dnp: '31.5', alt: '18' },
        oe: { esf: '+1.75', cil: '-0.75', eixo: '170', add: '+2.00', dnp: '32.0', alt: '18' },
        dp: '63.5', dpOd: '31.5', dpOe: '32.0', prisOd: '', prisOe: ''
      },
      frameOrigin: 'Fornecida pela loja',
      frameMaterial: 'Acetato',
      frameReference: 'RB7047',
      frameColor: 'Preto Fosco',
      frameBrand: 'Ray-Ban',
      lensType: 'Multifocal',
      lensMaterial: 'CR-39',
      treatments: 'Anti-reflexo, Filtro azul',
      externalLab: false,
      labName: '',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      technician: 'Tech Carlos',
      observations: 'Ajustar plaquetas no rosto do cliente.',
      urgency: 0,
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_2',
      osNumber: 'OC260707-0002',
      osStore: '984520',
      sequence: '002',
      clientName: 'Maria Mendonça',
      clientPhone: '(21) 99123-4567',
      storeName: 'Norte 2',
      storeId: 'norte-2',
      malote: 'Manhã',
      status: 'Montagem',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      recipeType: 'Receita óptica',
      prescription: {
        od: { esf: '-2.00', cil: '', eixo: '', add: '', dnp: '30.0', alt: '' },
        oe: { esf: '-2.25', cil: '', eixo: '', add: '', dnp: '30.0', alt: '' },
        dp: '60.0', dpOd: '30.0', dpOe: '30.0', prisOd: '', prisOe: ''
      },
      frameOrigin: 'Própria do cliente',
      frameMaterial: 'Metal',
      frameReference: 'RB3025',
      frameColor: 'Dourado',
      frameBrand: 'Ray-Ban',
      lensType: 'Visão simples',
      lensMaterial: 'Policarbonato',
      treatments: 'Anti-reflexo',
      externalLab: true,
      labName: 'ZEISS',
      serviceType: 'Troca de lente',
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      technician: '',
      observations: 'Aproveitar armação antiga que está em bom estado.',
      urgency: 1,
      urgencyReason: 'Reposição urgente',
      urgencyObservation: 'Cliente perdeu óculos antigo.',
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 3.5 * 3600 * 1000).toISOString(),
      mountingOrigin: 'externo',
    },
    {
      id: 'os_3',
      osNumber: 'OC260707-0003',
      osStore: '115421',
      sequence: '003',
      clientName: 'Ana Cláudia',
      clientPhone: '(21) 98888-7777',
      storeName: 'Centro 1',
      storeId: 'centro-1',
      malote: 'Tarde',
      status: 'Separando',
      sellerName: 'Vendedora Julia',
      entryDate: new Date(now.getTime() - 25 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      prescription: {
        od: { esf: '+0.50', cil: '-1.00', eixo: '90', add: '', dnp: '31.0', alt: '' },
        oe: { esf: '+0.75', cil: '-1.25', eixo: '95', add: '', dnp: '31.0', alt: '' },
        dp: '62.0', dpOd: '31.0', dpOe: '31.0', prisOd: '', prisOe: ''
      },
      frameOrigin: 'Fornecida pela loja',
      frameMaterial: 'TR90',
      frameReference: 'TR-990',
      frameColor: 'Azul Transparente',
      frameBrand: 'Carol Eyewear',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      treatments: 'Anti-reflexo',
      externalLab: false,
      labName: '',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      technician: 'Tech Roberto',
      observations: '',
      urgency: 2,
      urgencyReason: 'Única armação (sem enxergar)',
      urgencyObservation: 'Cliente com alto grau e sem sobressalente.',
      urgencyExtreme: 'Cliente idosa precisa dos óculos para locomoção diária.',
      createdAt: new Date(now.getTime() - 25 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_4',
      osNumber: 'OC260707-0004',
      osStore: '112003',
      sequence: '004',
      clientName: 'Roberto Carlos',
      clientPhone: '(21) 97777-6666',
      storeName: 'Gávea',
      storeId: 'gavea',
      malote: 'Noite',
      status: 'Separando',
      sellerName: 'Vendedora Clara',
      entryDate: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      prescription: null,
      frameOrigin: 'A definir',
      frameMaterial: 'Metal',
      frameReference: 'Ray-Ban Aviator',
      frameColor: 'Grafite',
      frameBrand: 'Ray-Ban',
      lensType: 'Solar',
      lensMaterial: 'CR-39',
      treatments: 'Polarizado, Espelhado',
      externalLab: false,
      labName: '',
      serviceType: 'Lente avulsa',
      deadline: new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      technician: '',
      observations: '',
      urgency: 0,
      createdAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_5',
      osNumber: 'OC260707-0005',
      osStore: '100151',
      sequence: '005',
      clientName: 'Carlos Eduardo',
      clientPhone: '(21) 99888-1111',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Chegada de Malote',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_6',
      osNumber: 'OC260707-0006',
      osStore: '100152',
      sequence: '006',
      clientName: 'Patricia Lima',
      clientPhone: '(21) 99777-2222',
      storeName: 'Norte 2',
      storeId: 'norte-2',
      malote: 'Manhã',
      status: 'Envio Laboratório',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Policarbonato',
      externalLab: true,
      labName: 'Essilor',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 6 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2.5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_7',
      osNumber: 'OC260707-0007',
      osStore: '100153',
      sequence: '007',
      clientName: 'Fernando Souza',
      clientPhone: '(21) 99666-3333',
      storeName: 'Centro 1',
      storeId: 'centro-1',
      malote: 'Tarde',
      status: 'Montagem',
      sellerName: 'Vendedora Julia',
      entryDate: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
      recipeType: 'Receita óptica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 1,
      urgencyReason: 'Trabalho/Estudo',
      createdAt: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_8',
      osNumber: 'OC260707-0008',
      osStore: '100154',
      sequence: '008',
      clientName: 'Mariana Costa',
      clientPhone: '(21) 99555-4444',
      storeName: 'Tijuca 1',
      storeId: 'tijuca-1',
      malote: 'Tarde',
      status: 'Separando',
      sellerName: 'Vendedor Pedro',
      entryDate: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Solar',
      lensMaterial: 'Policarbonato',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_9',
      osNumber: 'OC260707-0009',
      osStore: '100155',
      sequence: '009',
      clientName: 'Marcos Santos',
      clientPhone: '(21) 99444-5555',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Entregue na Loja',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date().toISOString(),
        recipientName: 'Carlos Vendedor',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      }
    },
    {
      id: 'os_10',
      osNumber: 'OC260707-0010',
      osStore: '100156',
      sequence: '010',
      clientName: 'Juliana Paes',
      clientPhone: '(21) 99333-6666',
      storeName: 'Plaza',
      storeId: 'plaza',
      malote: 'Manhã',
      status: 'Entregue c/ Ressalva',
      sellerName: 'Vendedora Mariana',
      entryDate: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Alto índice',
      externalLab: true,
      labName: 'Hoya',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 1,
      urgencyReason: 'Garantia de Adaptação',
      createdAt: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date().toISOString(),
        recipientName: 'Vendedora Mariana',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      }
    },
    {
      id: 'os_11',
      osNumber: 'OC260707-0011',
      osStore: '100157',
      sequence: '011',
      clientName: 'Pedro Alvares',
      clientPhone: '(21) 99222-7777',
      storeName: 'Centro 1',
      storeId: 'centro-1',
      malote: 'Tarde',
      status: 'Entregue ao Cliente',
      sellerName: 'Vendedora Julia',
      entryDate: new Date(now.getTime() - 72 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 72 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        recipientName: 'Vendedora Julia',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      },
      clientPickup: {
        ts: new Date().toISOString(),
        pickedUpBy: 'Titular',
        relationship: '',
      }
    },
    {
      id: 'os_12',
      osNumber: 'OC260707-0012',
      osStore: '100158',
      sequence: '012',
      clientName: 'Ricardo Amorim',
      clientPhone: '(21) 99111-8888',
      storeName: 'Gávea',
      storeId: 'gavea',
      malote: 'Noite',
      status: 'Chegada de Malote',
      sellerName: 'Vendedora Clara',
      entryDate: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Policarbonato',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 1,
      urgencyReason: 'Trabalho/Estudo',
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_13',
      osNumber: 'OC260707-0013',
      osStore: '100159',
      sequence: '013',
      clientName: 'Beatriz Oliveira',
      clientPhone: '(21) 99000-9999',
      storeName: 'Tijuca 1',
      storeId: 'tijuca-1',
      malote: 'Tarde',
      status: 'Envio Laboratório',
      sellerName: 'Vendedor Pedro',
      entryDate: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      recipeType: 'Receita óptica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Troca de lente',
      deadline: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_14',
      osNumber: 'OC260707-0014',
      osStore: '100160',
      sequence: '014',
      clientName: 'Lucas Lima',
      clientPhone: '(21) 98888-0000',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Montagem',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Bifocal',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      isStopped: true,
      stoppedReason: 'Aguardando armação do cliente que ficou de trazer depois.',
    },
    {
      id: 'os_15',
      osNumber: 'OC260707-0015',
      osStore: '100161',
      sequence: '015',
      clientName: 'Bruno Mezenga',
      clientPhone: '(21) 98777-1111',
      storeName: 'Centro 1',
      storeId: 'centro-1',
      malote: 'Tarde',
      status: 'Controle de Qualidade',
      sellerName: 'Vendedora Julia',
      entryDate: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_16',
      osNumber: 'OC260707-0016',
      osStore: '100162',
      sequence: '016',
      clientName: 'Luana Berdinazi',
      clientPhone: '(21) 98666-2222',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Separando',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Solar',
      lensMaterial: 'Policarbonato',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_17',
      osNumber: 'OC260707-0017',
      osStore: '100163',
      sequence: '017',
      clientName: 'Geremias Berdinazi',
      clientPhone: '(21) 98555-3333',
      storeName: 'Gávea',
      storeId: 'gavea',
      malote: 'Noite',
      status: 'Separando',
      sellerName: 'Vendedora Clara',
      entryDate: new Date(now.getTime() - 15 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 15 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_18',
      osNumber: 'OC260707-0018',
      osStore: '100164',
      sequence: '018',
      clientName: 'Sandra Rosa',
      clientPhone: '(21) 98444-4444',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Entregue ao Cliente',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 96 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Alto índice',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 96 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        recipientName: 'Carlos Vendedor',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      },
      clientPickup: {
        ts: new Date().toISOString(),
        pickedUpBy: 'Titular',
        relationship: '',
      }
    },
    {
      id: 'os_19',
      osNumber: 'OC260707-0019',
      osStore: '100165',
      sequence: '019',
      clientName: 'Gilberto Gil',
      clientPhone: '(21) 98333-5555',
      storeName: 'Freguesia 1',
      storeId: 'freguesia-1',
      malote: 'Manhã',
      status: 'Chegada de Malote',
      sellerName: 'Vendedor Pedro',
      entryDate: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Solar',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_20',
      osNumber: 'OC260707-0020',
      osStore: '100166',
      sequence: '020',
      clientName: 'Caetano Veloso',
      clientPhone: '(21) 98222-6666',
      storeName: 'Centro 2',
      storeId: 'centro-2',
      malote: 'Tarde',
      status: 'Envio Laboratório',
      sellerName: 'Vendedora Julia',
      entryDate: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Policarbonato',
      externalLab: true,
      labName: 'Hoya',
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_21',
      osNumber: 'OC260707-0021',
      osStore: '100167',
      sequence: '021',
      clientName: 'Chico Buarque',
      clientPhone: '(21) 98111-7777',
      storeName: 'Norte 2',
      storeId: 'norte-2',
      malote: 'Manhã',
      status: 'Montagem',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      parentOsId: 'os_2',
      rectification: {
        reason: 'Eixo da lente fora do padrão detectado no controle de qualidade interno.',
        action: 'Refazer montagem com novo bloco de lente.',
      }
    },
    {
      id: 'os_22',
      osNumber: 'OC260707-0022',
      osStore: '100168',
      sequence: '022',
      clientName: 'Elis Regina',
      clientPhone: '(21) 98000-8888',
      storeName: 'Ipanema',
      storeId: 'ipanema',
      malote: 'Noite',
      status: 'Chegada de Malote',
      sellerName: 'Vendedora Clara',
      entryDate: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      parentOsId: 'os_4',
      rectification: {
        reason: 'Grau divergente da receita médica apontado pelo cliente na retirada.',
        action: 'Solicitada redigitização da lente para confirmação com laboratório central.',
      }
    },
    {
      id: 'os_23',
      osNumber: 'OC260707-0023',
      osStore: '100169',
      sequence: '023',
      clientName: 'Gal Costa',
      clientPhone: '(21) 97999-9999',
      storeName: 'Plaza',
      storeId: 'plaza',
      malote: 'Manhã',
      status: 'Envio Laboratório',
      sellerName: 'Vendedora Mariana',
      entryDate: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'Alto índice',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
      isStopped: true,
      stoppedReason: 'Falta confirmação do laboratório sobre disponibilidade da lente.',
    },
    {
      id: 'os_24',
      osNumber: 'OC260707-0024',
      osStore: '100170',
      sequence: '024',
      clientName: 'Maria Bethânia',
      clientPhone: '(21) 97888-0000',
      storeName: 'Tijuca 2',
      storeId: 'tijuca-2',
      malote: 'Tarde',
      status: 'Entregue na Loja',
      sellerName: 'Vendedor Pedro',
      entryDate: new Date(now.getTime() - 28 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Solar',
      lensMaterial: 'Policarbonato',
      externalLab: false,
      serviceType: 'Lente avulsa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 28 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date().toISOString(),
        recipientName: 'Vendedor Pedro',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      }
    },
    {
      id: 'os_25',
      osNumber: 'OC260707-0025',
      osStore: '100171',
      sequence: '025',
      clientName: 'Milton Nascimento',
      clientPhone: '(21) 97777-1111',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Montagem',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 2,
      urgencyReason: 'Única armação (sem enxergar)',
      createdAt: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_26',
      osNumber: 'OC260707-0026',
      osStore: '100172',
      sequence: '026',
      clientName: 'Jorge Ben',
      clientPhone: '(21) 97666-2222',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Separando',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Multifocal',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'os_27',
      osNumber: 'OC260707-0027',
      osStore: '100173',
      sequence: '027',
      clientName: 'Tim Maia',
      clientPhone: '(21) 97555-3333',
      storeName: 'Norte 1',
      storeId: 'norte-1',
      malote: 'Manhã',
      status: 'Entregue c/ Ressalva',
      sellerName: 'Carlos Vendedor',
      entryDate: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
      recipeType: 'Receita médica',
      lensType: 'Solar',
      lensMaterial: 'CR-39',
      externalLab: false,
      serviceType: 'Montagem completa',
      deadline: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      urgency: 0,
      createdAt: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
      statusChangedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      reception: {
        ts: new Date().toISOString(),
        recipientName: 'Carlos Vendedor',
        photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
      }
    }
  ];

  return mockOrders.map(o => {
    const defaultAudit: AuditLogEntry[] = [
      {
        id: uid(),
        timestamp: o.createdAt || now.toISOString(),
        userId: 'usr_vend_1',
        userName: 'Carlos Vendedor',
        action: 'Criação de OS',
        fromStatus: null,
        toStatus: 'Chegada de Malote',
        details: 'Ordem de serviço criada na loja.',
      }
    ];

    if (o.status !== 'Chegada de Malote') {
      defaultAudit.push({
        id: uid(),
        timestamp: o.statusChangedAt || now.toISOString(),
        userId: 'usr_lab_1',
        userName: 'Roberto Lab',
        action: 'Movimentação operacional',
        fromStatus: 'Chegada de Malote',
        toStatus: o.status || 'Chegada de Malote',
        details: `OS avançada para ${o.status}.`,
      });
    }

    return {
      id: uid(),
      osStore: '',
      sequence: '001',
      clientName: '',
      clientPhone: '',
      storeName: '',
      storeId: '',
      malote: 'Manhã',
      status: 'Chegada de Malote',
      sellerName: '',
      entryDate: now.toISOString(),
      recipeType: '',
      prescription: null,
      frameOrigin: '',
      frameMaterial: '',
      frameReference: '',
      frameColor: '',
      frameBrand: '',
      lensType: '',
      lensMaterial: '',
      treatments: '',
      externalLab: false,
      labName: '',
      serviceType: '',
      deadline: '',
      technician: '',
      observations: '',
      urgency: 0,
      urgencyReason: '',
      urgencyObservation: '',
      urgencyExtreme: '',
      receiptImageUrl: null,
      origin: 'loja',
      mountingOrigin: null,
      createdAt: now.toISOString(),
      statusChangedAt: now.toISOString(),
      reception: null,
      clientPickup: null,
      rectification: null,
      parentOsId: null,
      isStopped: false,
      stoppedReason: null,
      createdBy: o.createdBy || 'usr_vend_1',
      createdByRole: o.createdByRole || 'vendedor',
      auditLog: defaultAudit,
      ...o
    } as ServiceOrder;
  });
}

function getStoredOrders(): ServiceOrder[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = getInitialSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function saveStoredOrders(orders: ServiceOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function getStoredNotifications(): WhatsAppNotification[] {
  const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw);
}

function saveStoredNotifications(notifs: WhatsAppNotification[]) {
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
}

function getCurrentUserFromStorage(): any | null {
  const raw = localStorage.getItem('malote-lab-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
}

export class ServiceOrdersMockApi implements IServiceOrdersApi {
  async getServiceOrders(filters?: {
    storeId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ServiceOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    let orders = getStoredOrders();

    const currentUser = getCurrentUserFromStorage();
    if (currentUser && currentUser.role === 'vendedor') {
      orders = orders.filter(o => 
        o.storeId === currentUser.storeId
      );
    }

    if (filters) {
      if (filters.storeId) {
        orders = orders.filter(o => o.storeId === filters.storeId);
      }
      if (filters.status) {
        orders = orders.filter(o => o.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        orders = orders.filter(o => 
          o.osNumber.toLowerCase().includes(q) ||
          o.osStore.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          o.sequence.toLowerCase().includes(q)
        );
      }
      if (filters.dateFrom) {
        orders = orders.filter(o => o.entryDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        orders = orders.filter(o => o.entryDate <= filters.dateTo!);
      }
    }

    return orders;
  }

  async createServiceOrder(payload: CreateOSPayload, userId: string, userName: string): Promise<ServiceOrder> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const orders = getStoredOrders();

    const osNumber = generateOSNumber();
    const storeMalote = getMaloteForStore(payload.storeName) || 'Manhã';

    // Calculate sequence for store today
    const todayStr = new Date().toISOString().slice(0, 10);
    const storeTodayCount = orders.filter(o => 
      o.storeName === payload.storeName && 
      o.createdAt.startsWith(todayStr)
    ).length;
    const sequence = String(storeTodayCount + 1).padStart(3, '0');

    // Simulate file uploading by reading mock URL or base64
    let receiptImageUrl: string | null = null;
    if (payload.receiptImage) {
      receiptImageUrl = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80';
    }

    const newOrder: ServiceOrder = {
      id: uid(),
      osNumber,
      osStore: payload.osStore,
      sequence,
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      storeName: payload.storeName,
      storeId: payload.storeName.toLowerCase().replace(/\s+/g, '-'),
      malote: storeMalote,
      status: 'Chegada de Malote',
      sellerName: payload.sellerName,
      entryDate: payload.entryDate || new Date().toISOString(),
      recipeType: payload.recipeType,
      prescription: payload.prescription,
      frameOrigin: payload.frameOrigin,
      frameMaterial: payload.frameMaterial,
      frameReference: payload.frameReference,
      frameColor: payload.frameColor,
      frameBrand: payload.frameBrand,
      lensType: payload.lensType,
      lensMaterial: payload.lensMaterial,
      treatments: payload.treatments,
      externalLab: payload.externalLab,
      labName: payload.labName,
      serviceType: payload.serviceType,
      deadline: payload.deadline,
      technician: payload.technician,
      observations: payload.observations,
      urgency: payload.urgency,
      urgencyReason: payload.urgencyReason,
      urgencyObservation: payload.urgencyObservation,
      urgencyExtreme: payload.urgencyExtreme,
      receiptImageUrl,
      origin: 'loja',
      mountingOrigin: null,
      createdAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
      reception: null,
      clientPickup: null,
      rectification: null,
      parentOsId: null,
      isStopped: false,
      stoppedReason: null,
      createdBy: userId,
      createdByRole: (() => {
        const rawUsers = localStorage.getItem('oticas_carol_users');
        if (rawUsers) {
          try {
            const users = JSON.parse(rawUsers);
            const matchedUser = Object.values(users).find((u: any) => u.id === userId);
            if (matchedUser) return (matchedUser as any).role;
          } catch {}
        }
        return 'vendedor';
      })(),
      auditLog: [
        {
          id: uid(),
          timestamp: new Date().toISOString(),
          userId,
          userName,
          action: 'Criação de OS',
          fromStatus: null,
          toStatus: 'Chegada de Malote',
          details: `Ordem de serviço criada com sucesso na loja. Número: ${osNumber}. Vendedor: ${payload.sellerName}.`,
        }
      ],
    };

    orders.push(newOrder);
    saveStoredOrders(orders);

    return newOrder;
  }

  async updateServiceOrder(
    id: string,
    payload: CreateOSPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Ordem de serviço não encontrada.' };
    }

    const existing = orders[index];
    const updated: ServiceOrder = {
      ...existing,
      osStore: payload.osStore,
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      recipeType: payload.recipeType,
      prescription: payload.prescription,
      frameOrigin: payload.frameOrigin,
      frameMaterial: payload.frameMaterial || '',
      frameReference: payload.frameReference || '',
      frameColor: payload.frameColor || '',
      frameBrand: payload.frameBrand || '',
      lensType: payload.lensType,
      lensMaterial: payload.lensMaterial,
      treatments: payload.treatments || '',
      externalLab: payload.externalLab,
      labName: payload.labName || '',
      serviceType: payload.serviceType,
      deadline: payload.deadline,
      technician: payload.technician || '',
      observations: payload.observations || '',
      urgency: payload.urgency as any,
      urgencyReason: payload.urgencyReason || '',
      urgencyObservation: payload.urgencyObservation || '',
      urgencyExtreme: payload.urgencyExtreme || '',
    };

    updated.auditLog.push({
      id: uid(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action: 'Edição de OS',
      fromStatus: null,
      toStatus: null,
      details: 'Informações gerais da ordem de serviço atualizadas pelo vendedor.',
    });

    orders[index] = updated;
    saveStoredOrders(orders);
    return updated;
  }

  async transitionStatus(
    id: string,
    payload: TransitionPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const orders = getStoredOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Ordem de serviço não encontrada.' };
    }

    const order = orders[orderIndex];
    const fromStatus = order.status;
    const toStatus = payload.to;

    // Determine user role for business logic checks
    const userRole = (() => {
      const rawUsers = localStorage.getItem('oticas_carol_users');
      if (rawUsers) {
        try {
          const users = JSON.parse(rawUsers);
          const matchedUser = Object.values(users).find((u: any) => u.id === userId);
          if (matchedUser) return (matchedUser as any).role;
        } catch {}
      }
      return 'vendedor';
    })();

    // Block moving to 'Pronto para Expedição' without pouchCode for vendedor and laboratorio roles
    if (toStatus === 'Pronto para Expedição' && !payload.pouchCode && (userRole === 'laboratorio' || userRole === 'vendedor')) {
      throw { code: 'POUCH_REQUIRED', message: 'Não é permitido mover uma OS para Pronto para Expedição sem vinculá-la a um malote.' };
    }

    // Check custom business logic transitions if needed
    order.status = toStatus;
    order.statusChangedAt = new Date().toISOString();

    if (payload.mountingOrigin) {
      order.mountingOrigin = payload.mountingOrigin;
    }

    if (payload.pouchCode) {
      order.pouchCode = payload.pouchCode;
    }

    // Handle confirming receipt (Entregue na Loja or Entregue c/ Ressalva)
    if (toStatus === 'Entregue na Loja' || toStatus === 'Entregue c/ Ressalva') {
      const withinDeadline = order.deadline 
        ? new Date() <= new Date(order.deadline + 'T23:59:59')
        : true;

      order.reception = {
        ok: toStatus === 'Entregue na Loja',
        ts: new Date().toISOString(),
        observation: payload.reason || (toStatus === 'Entregue na Loja' ? 'Chegou perfeitamente' : ''),
        photoUrl: payload.photoUrl || null,
        confirmedBy: userName,
        receivedBy: payload.receivedBy || userName,
        withinDeadline,
        deadlineDate: order.deadline || null,
      };

      // Auto trigger a mock notification
      const notifs = getStoredNotifications();
      const newNotif: WhatsAppNotification = {
        id: uid(),
        type: toStatus === 'Entregue na Loja' ? 'receipt_ok' : 'receipt_problem',
        osNumber: order.osNumber,
        clientName: order.clientName,
        storeName: order.storeName,
        malote: order.malote,
        timestamp: new Date().toISOString(),
        observation: order.reception.observation || '',
        photoUrl: order.reception.photoUrl,
        receivedBy: userName,
        withinDeadline,
        sentVia: 'auto',
        messagePreview: `Carol Informa: Seu pedido ${order.osNumber} chegou na loja e está disponível para retirada!`
      };
      notifs.unshift(newNotif);
      saveStoredNotifications(notifs);

      // Emulate cross-tab updates using storage event
      localStorage.setItem('oc_last_notif', JSON.stringify({
        ts: new Date().toISOString(),
        os: order.osNumber,
        loja: order.storeName,
        ok: toStatus === 'Entregue na Loja'
      }));
    }

    // Audit log update
    const details = payload.pouchCode
      ? `OS vinculada ao Malote ${payload.pouchCode} e movida para Pronto para Expedição.`
      : (payload.reason ? `Movido com justificativa: ${payload.reason}` : `Operação realizada com sucesso.`);

    const auditEntry: AuditLogEntry = {
      id: uid(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action: 'Alteração de Status',
      fromStatus,
      toStatus,
      details,
    };
    order.auditLog.push(auditEntry);

    orders[orderIndex] = order;
    saveStoredOrders(orders);

    return order;
  }

  async getServiceOrderById(id: string): Promise<ServiceOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    return order || null;
  }

  async confirmClientPickup(
    id: string,
    pickedUpBy: string,
    deliveredBy: string,
    observation: string
  ): Promise<ServiceOrder> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const orders = getStoredOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Ordem de serviço não encontrada.' };
    }

    const order = orders[orderIndex];
    const fromStatus = order.status;

    order.status = 'Entregue ao Cliente';
    order.statusChangedAt = new Date().toISOString();
    order.clientPickup = {
      pickedUpBy,
      deliveredBy,
      ts: new Date().toISOString(),
      observation,
    };

    order.auditLog.push({
      id: uid(),
      timestamp: new Date().toISOString(),
      userId: 'usr_store_employee',
      userName: deliveredBy,
      action: 'Entrega para Cliente',
      fromStatus,
      toStatus: 'Entregue ao Cliente',
      details: `Retirado por ${pickedUpBy}. Obs: ${observation || 'Nenhuma'}`,
    });

    orders[orderIndex] = order;
    saveStoredOrders(orders);

    return order;
  }

  async rectifyOS(
    id: string,
    reason: string,
    action: string,
    createdBy: string,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const orders = getStoredOrders();
    const parentIndex = orders.findIndex(o => o.id === id);

    if (parentIndex === -1) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Ordem de serviço original não encontrada.' };
    }

    const parent = orders[parentIndex];
    const childOsNumber = `${parent.osNumber}-R`;
    const childId = uid();

    // Rectification details
    const rectification = {
      id: uid(),
      parentOsId: parent.id,
      childOsId: childId,
      reason,
      action,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    parent.rectification = rectification;
    
    // Auto-create daughter OS
    const childOS: ServiceOrder = {
      ...parent,
      id: childId,
      osNumber: childOsNumber,
      sequence: `${parent.sequence}R`,
      status: 'Chegada de Malote',
      createdAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
      parentOsId: parent.id,
      reception: null,
      clientPickup: null,
      rectification: null,
      isStopped: false,
      stoppedReason: null,
      auditLog: [
        {
          id: uid(),
          timestamp: new Date().toISOString(),
          userId,
          userName,
          action: 'Criação de OS filha (Retificação)',
          fromStatus: null,
          toStatus: 'Chegada de Malote',
          details: `OS filha criada em retificação à OS mãe ${parent.osNumber}. Motivo: ${reason}. Ação: ${action}.`,
        }
      ],
    };

    parent.auditLog.push({
      id: uid(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action: 'Abertura de Retificação',
      fromStatus: parent.status,
      toStatus: parent.status,
      details: `Retificação solicitada. Criada OS filha ${childOsNumber}.`,
    });

    orders.push(childOS);
    saveStoredOrders(orders);

    // Cross-tab communication simulation
    localStorage.setItem('oc_new_retif', JSON.stringify({
      ts: new Date().toISOString(),
      os: parent.osNumber,
      loja: parent.storeName,
      cli: parent.clientName,
    }));

    return parent;
  }

  async getNotifications(_period?: string): Promise<WhatsAppNotification[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredNotifications();
  }

  async sendWhatsAppNotification(notification: Partial<WhatsAppNotification>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulated WhatsApp API trigger
    console.log('Mock WhatsApp message dispatched successfully:', notification.messagePreview);
  }
}
