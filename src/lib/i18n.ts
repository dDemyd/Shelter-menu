import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export type Lang = 'uk' | 'en'

const _lang = useStorage<Lang>('shelter:lang', 'uk')

// Coerce any stale / invalid localStorage value back to 'uk' or 'en'.
export const lang = computed<Lang>({
  get: () => (_lang.value === 'en' ? 'en' : 'uk'),
  set: (v) => { _lang.value = v === 'en' ? 'en' : 'uk' },
})

export function toggleLang() {
  lang.value = lang.value === 'uk' ? 'en' : 'uk'
}

interface Bilingual {
  name_uk?: string | null
  name_en?: string | null
  title_uk?: string | null
  title_en?: string | null
  description_uk?: string | null
  description_en?: string | null
  note_uk?: string | null
  note_en?: string | null
  cta_label_uk?: string | null
  cta_label_en?: string | null
}

export function pickName(item: Bilingual | null | undefined): string {
  if (!item) return ''
  if (lang.value === 'en') return item.name_en || item.title_en || item.name_uk || item.title_uk || ''
  return item.name_uk || item.title_uk || item.name_en || item.title_en || ''
}

export function pickDescription(item: Bilingual | null | undefined): string {
  if (!item) return ''
  if (lang.value === 'en') return item.description_en || item.description_uk || ''
  return item.description_uk || item.description_en || ''
}

export function pickNote(item: Bilingual | null | undefined): string {
  if (!item) return ''
  if (lang.value === 'en') return item.note_en || item.note_uk || ''
  return item.note_uk || item.note_en || ''
}

export function pickCta(item: Bilingual | null | undefined): string {
  if (!item) return ''
  if (lang.value === 'en') return item.cta_label_en || item.cta_label_uk || ''
  return item.cta_label_uk || item.cta_label_en || ''
}

const T = {
  uk: {
    callBartender: 'Позвати бармена',
    submitOrder: 'Передати замовлення на бар',
    callOnly: 'Просто покликати',
    yourOrder: 'Ваше замовлення',
    emptyCart: 'Кошик порожній — додайте позиції або просто покличте бармена',
    table: 'Стіл',
    contact: 'Ваш контакт',
    contactPh: '+380 ___ ___ __ __',
    contactRequired: 'Вкажіть номер телефону, щоб ми з вами зв’язалися',
    addComment: 'Коментар для бармена',
    commentPh: 'Менше льоду, без цибулі…',
    total: 'Сума',
    addToOrder: 'Додати до замовлення',
    added: 'Додано до замовлення',
    addedFav: 'У обраних',
    hidden: 'Сховано',
    orderSent: 'Замовлення передано',
    barmanCalled: 'Бармен повідомлений',
    search: 'Пошук',
    searchPh: 'Що шукаєте?',
    noResults: 'Нічого не знайдено',
    noTableTitle: 'Не знайдено номер столика',
    noTableSub: 'Скануйте QR-код на вашому столі ще раз або зверніться до персоналу',
    swipeMode: 'Свайп',
    listMode: 'Список',
    nextCard: 'Свайпайте картки або тисніть кнопки',
    hookahConstructor: 'Конструктор міксів',
    hookahConstructorSub: 'Зберіть свій ідеальний мікс',
    open: 'Відкрити',
    close: 'Закрити',
    edit: 'Редагувати',
    delete: 'Видалити',
    save: 'Зберегти',
    cancel: 'Скасувати',
    create: 'Створити',
    available: 'В наявності',
    unavailable: 'Немає',
    active: 'Активно',
    hidden_: 'Прихов.',
    login: 'Увійти',
    logout: 'Вийти',
    venueLine: 'lounge / arthouse · київ',
    statusOpen: 'ВІДЧИНЕНО',
    statusClosed: 'ЗАЧИНЕНО',
    wordPrimary: 'СХОВИЩЕ',
    wordSecondary: 'SHELTER',
    badges: {
      new: 'НОВИНКА',
      signature: 'ФІРМОВИЙ',
      hot: 'ГОСТРИЙ',
      strong: 'МІЦНИЙ',
      na: 'БЕЗ АЛКО',
    } as Record<string, string>,
  },
  en: {
    callBartender: 'Call bartender',
    submitOrder: 'Send order to the bar',
    callOnly: 'Just call',
    yourOrder: 'Your order',
    emptyCart: 'Cart is empty — add items or just call the bartender',
    table: 'Table',
    contact: 'Your contact',
    contactPh: '+380 ___ ___ __ __',
    contactRequired: 'Please provide a phone number so we can reach you',
    addComment: 'Comment for the bartender',
    commentPh: 'Less ice, no onions…',
    total: 'Total',
    addToOrder: 'Add to order',
    added: 'Added to order',
    addedFav: 'Saved',
    hidden: 'Hidden',
    orderSent: 'Order received',
    barmanCalled: 'Bartender notified',
    search: 'Search',
    searchPh: 'What are you looking for?',
    noResults: 'Nothing found',
    noTableTitle: 'Table number missing',
    noTableSub: 'Re-scan the QR code on your table or ask the staff',
    swipeMode: 'Swipe',
    listMode: 'List',
    nextCard: 'Swipe cards or use the buttons',
    hookahConstructor: 'Mix constructor',
    hookahConstructorSub: 'Build your perfect blend',
    open: 'Open',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    available: 'In stock',
    unavailable: 'Out',
    active: 'Active',
    hidden_: 'Hidden',
    login: 'Log in',
    logout: 'Log out',
    venueLine: 'lounge / arthouse · kyiv',
    statusOpen: 'OPEN',
    statusClosed: 'CLOSED',
    wordPrimary: 'SHELTER',
    wordSecondary: 'СХОВИЩЕ',
    badges: {
      new: 'NEW',
      signature: 'SIGNATURE',
      hot: 'HOT',
      strong: 'STRONG',
      na: 'ALCOHOL FREE',
    } as Record<string, string>,
  },
}

export const t = computed(() => T[lang.value] ?? T.uk)
export const tRef = ref(T)
