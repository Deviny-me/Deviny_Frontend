import { City } from 'country-state-city'

// Country data interface (without cities - those come from country-state-city package)
export interface CountryData {
  name: string
  phoneCode: string
  phoneFormat: string // Format pattern: X = digit, - and space for separators
  maxDigits: number // Maximum number of digits (without country code)
}

// Russian translations for common city names
const CITY_TRANSLATIONS: Record<string, string> = {
  // Russia
  'Moscow': 'Москва', 'Saint Petersburg': 'Санкт-Петербург', 'Novosibirsk': 'Новосибирск',
  'Yekaterinburg': 'Екатеринбург', 'Kazan': 'Казань', 'Nizhny Novgorod': 'Нижний Новгород',
  'Chelyabinsk': 'Челябинск', 'Samara': 'Самара', 'Omsk': 'Омск', 'Rostov-on-Don': 'Ростов-на-Дону',
  'Ufa': 'Уфа', 'Krasnoyarsk': 'Красноярск', 'Voronezh': 'Воронеж', 'Perm': 'Пермь',
  'Volgograd': 'Волгоград', 'Krasnodar': 'Краснодар', 'Saratov': 'Саратов', 'Tyumen': 'Тюмень',
  'Tolyatti': 'Тольятти', 'Izhevsk': 'Ижевск', 'Barnaul': 'Барнаул', 'Ulyanovsk': 'Ульяновск',
  'Irkutsk': 'Иркутск', 'Khabarovsk': 'Хабаровск', 'Yaroslavl': 'Ярославль', 'Vladivostok': 'Владивосток',
  'Makhachkala': 'Махачкала', 'Tomsk': 'Томск', 'Orenburg': 'Оренбург', 'Kemerovo': 'Кемерово',
  'Novokuznetsk': 'Новокузнецк', 'Ryazan': 'Рязань', 'Astrakhan': 'Астрахань', 'Penza': 'Пенза',
  'Kirov': 'Киров', 'Lipetsk': 'Липецк', 'Cheboksary': 'Чебоксары', 'Tula': 'Тула',
  'Kaliningrad': 'Калининград', 'Stavropol': 'Ставрополь', 'Kursk': 'Курск', 'Tver': 'Тверь',
  'Magnitogorsk': 'Магнитогорск', 'Sochi': 'Сочи', 'Bryansk': 'Брянск', 'Surgut': 'Сургут',
  'Vladimir': 'Владимир', 'Arkhangelsk': 'Архангельск', 'Belgorod': 'Белгород', 'Smolensk': 'Смоленск',
  'Kaluga': 'Калуга', 'Murmansk': 'Мурманск', 'Orel': 'Орёл', 'Vologda': 'Вологда',
  'Cherepovets': 'Череповец', 'Saransk': 'Саранск', 'Tambov': 'Тамбов', 'Kostroma': 'Кострома',
  'Novorossiysk': 'Новороссийск', 'Taganrog': 'Таганрог', 'Petrozavodsk': 'Петрозаводск',
  'Nizhnevartovsk': 'Нижневартовск', 'Yoshkar-Ola': 'Йошкар-Ола', 'Syktyvkar': 'Сыктывкар',
  'Nizhny Tagil': 'Нижний Тагил', 'Nalchik': 'Нальчик', 'Pskov': 'Псков', 'Velikiy Novgorod': 'Великий Новгород',

  // USA
  'New York': 'Нью-Йорк', 'Los Angeles': 'Лос-Анджелес', 'Chicago': 'Чикаго',
  'Houston': 'Хьюстон', 'Phoenix': 'Финикс', 'Philadelphia': 'Филадельфия',
  'San Antonio': 'Сан-Антонио', 'San Diego': 'Сан-Диего', 'Dallas': 'Даллас',
  'San Jose': 'Сан-Хосе', 'Austin': 'Остин', 'Jacksonville': 'Джексонвилл',
  'Fort Worth': 'Форт-Уэрт', 'Columbus': 'Колумбус', 'San Francisco': 'Сан-Франциско',
  'Charlotte': 'Шарлотт', 'Indianapolis': 'Индианаполис', 'Seattle': 'Сиэтл',
  'Denver': 'Денвер', 'Washington': 'Вашингтон', 'Boston': 'Бостон',
  'Nashville': 'Нэшвилл', 'Detroit': 'Детройт', 'Portland': 'Портленд',
  'Las Vegas': 'Лас-Вегас', 'Miami': 'Майами', 'Atlanta': 'Атланта',
  'Minneapolis': 'Миннеаполис', 'Cleveland': 'Кливленд', 'Pittsburgh': 'Питтсбург',
  'Orlando': 'Орландо', 'Tampa': 'Тампа', 'Sacramento': 'Сакраменто',
  'Kansas City': 'Канзас-Сити', 'Salt Lake City': 'Солт-Лейк-Сити',

  // UK
  'London': 'Лондон', 'Birmingham': 'Бирмингем', 'Manchester': 'Манчестер',
  'Glasgow': 'Глазго', 'Liverpool': 'Ливерпуль', 'Bristol': 'Бристоль',
  'Sheffield': 'Шеффилд', 'Leeds': 'Лидс', 'Edinburgh': 'Эдинбург',
  'Leicester': 'Лестер', 'Coventry': 'Ковентри', 'Bradford': 'Брэдфорд',
  'Cardiff': 'Кардифф', 'Belfast': 'Белфаст', 'Nottingham': 'Ноттингем',
  'Plymouth': 'Плимут', 'Southampton': 'Саутгемптон', 'Reading': 'Рединг',
  'Derby': 'Дерби', 'Aberdeen': 'Абердин', 'Oxford': 'Оксфорд', 'Cambridge': 'Кембридж',

  // Germany
  'Berlin': 'Берлин', 'Hamburg': 'Гамбург', 'Munich': 'Мюнхен', 'Cologne': 'Кёльн',
  'Frankfurt': 'Франкфурт', 'Stuttgart': 'Штутгарт', 'Dusseldorf': 'Дюссельдорф',
  'Dortmund': 'Дортмунд', 'Essen': 'Эссен', 'Leipzig': 'Лейпциг', 'Bremen': 'Бремен',
  'Dresden': 'Дрезден', 'Hanover': 'Ганновер', 'Nuremberg': 'Нюрнберг',

  // France
  'Paris': 'Париж', 'Marseille': 'Марсель', 'Lyon': 'Лион', 'Toulouse': 'Тулуза',
  'Nice': 'Ницца', 'Nantes': 'Нант', 'Strasbourg': 'Страсбург', 'Montpellier': 'Монпелье',
  'Bordeaux': 'Бордо', 'Lille': 'Лилль', 'Rennes': 'Ренн', 'Reims': 'Реймс',

  // Italy
  'Rome': 'Рим', 'Milan': 'Милан', 'Naples': 'Неаполь', 'Turin': 'Турин',
  'Palermo': 'Палермо', 'Genoa': 'Генуя', 'Bologna': 'Болонья', 'Florence': 'Флоренция',
  'Venice': 'Венеция', 'Verona': 'Верона', 'Bari': 'Бари', 'Catania': 'Катания',

  // Spain
  'Madrid': 'Мадрид', 'Barcelona': 'Барселона', 'Valencia': 'Валенсия', 'Seville': 'Севилья',
  'Zaragoza': 'Сарагоса', 'Malaga': 'Малага', 'Murcia': 'Мурсия', 'Palma': 'Пальма',
  'Bilbao': 'Бильбао', 'Alicante': 'Аликанте', 'Cordoba': 'Кордова',

  // Ukraine
  'Kyiv': 'Киев', 'Kharkiv': 'Харьков', 'Odessa': 'Одесса', 'Dnipro': 'Днепр',
  'Donetsk': 'Донецк', 'Zaporizhzhia': 'Запорожье', 'Lviv': 'Львов',
  'Kryvyi Rih': 'Кривой Рог', 'Mykolaiv': 'Николаев', 'Mariupol': 'Мариуполь',
  'Luhansk': 'Луганск', 'Vinnytsia': 'Винница', 'Simferopol': 'Симферополь',
  'Kherson': 'Херсон', 'Poltava': 'Полтава', 'Chernihiv': 'Чернигов',
  'Cherkasy': 'Черкассы', 'Sumy': 'Сумы', 'Zhytomyr': 'Житомир',
  'Rivne': 'Ровно', 'Ternopil': 'Тернополь', 'Ivano-Frankivsk': 'Ивано-Франковск',
  'Lutsk': 'Луцк', 'Uzhgorod': 'Ужгород', 'Kramatorsk': 'Краматорск',

  // Poland
  'Warsaw': 'Варшава', 'Krakow': 'Краков', 'Lodz': 'Лодзь', 'Wroclaw': 'Вроцлав',
  'Poznan': 'Познань', 'Gdansk': 'Гданьск', 'Szczecin': 'Щецин', 'Bydgoszcz': 'Быдгощ',
  'Lublin': 'Люблин', 'Katowice': 'Катовице',

  // Canada
  'Toronto': 'Торонто', 'Montreal': 'Монреаль', 'Vancouver': 'Ванкувер', 'Calgary': 'Калгари',
  'Edmonton': 'Эдмонтон', 'Ottawa': 'Оттава', 'Winnipeg': 'Виннипег', 'Quebec': 'Квебек',

  // Japan
  'Tokyo': 'Токио', 'Yokohama': 'Йокогама', 'Osaka': 'Осака', 'Nagoya': 'Нагоя',
  'Sapporo': 'Саппоро', 'Fukuoka': 'Фукуока', 'Kobe': 'Кобе', 'Kyoto': 'Киото', 'Kawasaki': 'Кавасаки',

  // Kazakhstan
  'Almaty': 'Алматы', 'Astana': 'Астана', 'Shymkent': 'Шымкент', 'Karaganda': 'Караганда',
  'Aktobe': 'Актобе', 'Taraz': 'Тараз', 'Semey': 'Семей', 'Atyrau': 'Атырау',
  'Pavlodar': 'Павлодар', 'Oral': 'Уральск', 'Kostanay': 'Костанай', 'Petropavl': 'Петропавловск',
  'Aktau': 'Актау', 'Kyzylorda': 'Кызылорда', 'Turkestan': 'Туркестан',

  // Turkey
  'Istanbul': 'Стамбул', 'Ankara': 'Анкара', 'Izmir': 'Измир', 'Bursa': 'Бурса',
  'Antalya': 'Анталья', 'Adana': 'Адана', 'Konya': 'Конья', 'Gaziantep': 'Газиантеп',

  // China
  'Shanghai': 'Шанхай', 'Beijing': 'Пекин', 'Guangzhou': 'Гуанчжоу', 'Shenzhen': 'Шэньчжэнь',
  'Chengdu': 'Чэнду', 'Tianjin': 'Тяньцзинь', 'Wuhan': 'Ухань', 'Dongguan': 'Дунгуань',

  // India
  'Mumbai': 'Мумбаи', 'Delhi': 'Дели', 'Bangalore': 'Бангалор', 'Hyderabad': 'Хайдарабад',
  'Ahmedabad': 'Ахмадабад', 'Chennai': 'Ченнаи', 'Kolkata': 'Калькутта', 'Surat': 'Сурат', 'Pune': 'Пуна',

  // Brazil
  'Sao Paulo': 'Сан-Паулу', 'Rio de Janeiro': 'Рио-де-Жанейро', 'Brasilia': 'Бразилиа',
  'Salvador': 'Салвадор', 'Fortaleza': 'Форталеза', 'Belo Horizonte': 'Белу-Оризонти',
  'Manaus': 'Манаус', 'Curitiba': 'Куритиба',

  // Australia
  'Sydney': 'Сидней', 'Melbourne': 'Мельбурн', 'Brisbane': 'Брисбен', 'Perth': 'Перт',
  'Adelaide': 'Аделаида', 'Gold Coast': 'Голд-Кост', 'Newcastle': 'Ньюкасл', 'Canberra': 'Канберра',

  // South Korea
  'Seoul': 'Сеул', 'Busan': 'Пусан', 'Incheon': 'Инчхон', 'Daegu': 'Тэгу',
  'Daejeon': 'Тэджон', 'Gwangju': 'Кванджу', 'Suwon': 'Сувон', 'Ulsan': 'Ульсан',

  // Mexico
  'Mexico City': 'Мехико', 'Guadalajara': 'Гвадалахара', 'Monterrey': 'Монтеррей',
  'Puebla': 'Пуэбла', 'Tijuana': 'Тихуана', 'Leon': 'Леон',

  // UAE
  'Dubai': 'Дубай', 'Abu Dhabi': 'Абу-Даби', 'Sharjah': 'Шарджа', 'Ajman': 'Аджман',

  // Netherlands
  'Amsterdam': 'Амстердам', 'Rotterdam': 'Роттердам', 'The Hague': 'Гаага', 'Utrecht': 'Утрехт',

  // Scandinavia
  'Stockholm': 'Стокгольм', 'Gothenburg': 'Гётеборг', 'Oslo': 'Осло', 'Bergen': 'Берген',
  'Copenhagen': 'Копенгаген', 'Helsinki': 'Хельсинки',

  // Switzerland & Austria
  'Zurich': 'Цюрих', 'Geneva': 'Женева', 'Basel': 'Базель', 'Bern': 'Берн',
  'Vienna': 'Вена', 'Graz': 'Грац', 'Salzburg': 'Зальцбург', 'Innsbruck': 'Инсбрук',

  // Other Europe
  'Brussels': 'Брюссель', 'Antwerp': 'Антверпен', 'Athens': 'Афины', 'Thessaloniki': 'Салоники',
  'Lisbon': 'Лиссабон', 'Porto': 'Порту', 'Prague': 'Прага', 'Brno': 'Брно',
  'Bucharest': 'Бухарест', 'Budapest': 'Будапешт', 'Sofia': 'София',
  'Belgrade': 'Белград', 'Zagreb': 'Загреб', 'Bratislava': 'Братислава',
  'Dublin': 'Дублин', 'Reykjavik': 'Рейкьявик',

  // Belarus
  'Minsk': 'Минск', 'Gomel': 'Гомель', 'Mogilev': 'Могилёв', 'Vitebsk': 'Витебск',
  'Grodno': 'Гродно', 'Brest': 'Брест',

  // South Caucasus
  'Tbilisi': 'Тбилиси', 'Batumi': 'Батуми', 'Kutaisi': 'Кутаиси',
  'Yerevan': 'Ереван', 'Gyumri': 'Гюмри',
  'Baku': 'Баку', 'Ganja': 'Гянджа', 'Sumqayit': 'Сумгаит', 'Mingachevir': 'Мингечевир',
  'Lankaran': 'Ленкорань', 'Sheki': 'Шеки', 'Shirvan': 'Ширван', 'Nakhchivan': 'Нахичевань',
  // Azerbaijan - comprehensive
  'Agdzhabedy': 'Агджабеди', 'Astara': 'Астара', 'Barda': 'Барда',
  'Belokany': 'Белоканы', 'Beylagan': 'Бейлаган', 'Binagadi': 'Бинагади',
  'Culfa': 'Джульфа', 'Divichibazar': 'Дивичи', 'Fizuli': 'Физули',
  'Geoktschai': 'Геокчай', 'Goranboy': 'Горанбой', 'Hadrut': 'Гадрут',
  'Horadiz': 'Горадиз', 'Imishli': 'Имишли', 'Jalilabad': 'Джалилабад',
  'Jebrail': 'Джебраил', 'Kerbakhiar': 'Кельбаджар', 'Khirdalan': 'Хырдалан',
  'Mingelchaur': 'Мингечаур', 'Masally': 'Масаллы', 'Ordubad': 'Ордубад',
  'Sabirabad': 'Сабирабад', 'Salyan': 'Сальян', 'Shamakhi': 'Шемаха',
  'Shamkhor': 'Шамкир', 'Shushi': 'Шуша', 'Terter': 'Тертер', 'Tovuz': 'Товуз',
  'Ujar': 'Уджар', 'Yevlakh': 'Евлах', 'Zangilan': 'Зангилан',
  'Zardob': 'Зардоб', 'Lerik': 'Лерик', 'Martakert': 'Мартакерт',
  'Kilyazi': 'Кильязи', 'Askyaran': 'Аскеран',
  'Sharur City': 'Шарур', 'Balakhani': 'Балаханы', 'Mardakan': 'Мардакян',
  'Nardaran': 'Нардаран', 'Buzovna': 'Бузовна', 'Bilajari': 'Биладжары',
  'Lökbatan': 'Лёкбатан', 'Ramana': 'Рамана', 'Zabrat': 'Забрат',
  'Ceyranbatan': 'Джейранбатан', 'Novosaratovka': 'Новосаратовка',
  'Pushkino': 'Пушкино', 'Hövsan': 'Говсан', 'Gyuzdek': 'Гюздек',
  'Mughan': 'Мугань', 'Bakıxanov': 'Бакиханов', 'Maştağa': 'Маштага',
  'Türkan': 'Тюркян', 'Sabunçu': 'Сабунчу', 'Pirallahı': 'Пираллахи',
  'Qaraçuxur': 'Гарачухур', 'Qobu': 'Гобу', 'Qala': 'Гала',
  'Qaramanlı': 'Гараманлы', 'Qobustan': 'Гобустан', 'Qubadlı': 'Губадлы',
  'Quba': 'Куба', 'Qusar': 'Кусары',
  'Samux': 'Самух', 'Şirvan': 'Ширван',
  'Xaçmaz': 'Хачмаз', 'Xocalı': 'Ходжалы', 'Xudat': 'Худат',
  'Zaqatala': 'Закаталы', 'Laçın': 'Лачин', 'Neftçala': 'Нефтчала',
  'İsmayıllı': 'Исмаиллы', 'Hacıqabul': 'Гаджигабул', 'Qazax': 'Газах',
  'Qax': 'Гах', 'Oğuz': 'Огуз', 'Şahbuz': 'Шахбуз',
  'Sumqayıt': 'Сумгаит', 'Saray': 'Сарай', 'Yeni Suraxanı': 'Ени Сураханы',
  'Amirdzhan': 'Амирджан', 'Dolyar': 'Доляр', 'Heydarabad': 'Гейдарабад',
  'Kyadabek': 'Кедабек', 'Kyurdarmir': 'Кюрдамир', 'Khyzy': 'Хызы',
  'Sedarak': 'Седарак', 'Mincivan': 'Минджеван', 'Sovetabad': 'Советабад',
  'Vank': 'Ванк', 'Orjonikidze': 'Орджоникидзе',
  'Qırmızı Bazar': 'Гырмызы Базар', 'Saatlı': 'Саатлы',
  'Sanqaçal': 'Сангачал', 'Julfa Rayon': 'Джульфинский район',
  'Shahbuz Rayon': 'Шахбузский район', 'Ordubad Rayon': 'Ордубадский район',
  'Nizami Rayonu': 'Низаминский район', 'Ağdam': 'Агдам', 'Ağdaş': 'Агдаш',
  'Aghstafa': 'Агстафа', 'Aghsu': 'Агсу',

  // Central Asia
  'Tashkent': 'Ташкент', 'Samarkand': 'Самарканд', 'Bukhara': 'Бухара', 'Namangan': 'Наманган',
  'Bishkek': 'Бишкек', 'Osh': 'Ош',
  'Dushanbe': 'Душанбе', 'Khujand': 'Худжанд',
  'Ashgabat': 'Ашхабад',

  // Middle East
  'Jerusalem': 'Иерусалим', 'Tel Aviv': 'Тель-Авив', 'Haifa': 'Хайфа',
  'Riyadh': 'Эр-Рияд', 'Jeddah': 'Джидда', 'Mecca': 'Мекка',
  'Cairo': 'Каир', 'Alexandria': 'Александрия',
  'Tehran': 'Тегеран', 'Isfahan': 'Исфахан', 'Tabriz': 'Тебриз',
  'Baghdad': 'Багдад', 'Basra': 'Басра',
  'Amman': 'Амман', 'Beirut': 'Бейрут', 'Damascus': 'Дамаск',
  'Doha': 'Доха',

  // Africa
  'Johannesburg': 'Йоханнесбург', 'Cape Town': 'Кейптаун', 'Durban': 'Дурбан', 'Pretoria': 'Претория',
  'Lagos': 'Лагос', 'Nairobi': 'Найроби', 'Accra': 'Аккра', 'Addis Ababa': 'Аддис-Абеба',
  'Casablanca': 'Касабланка', 'Algiers': 'Алжир', 'Tunis': 'Тунис', 'Tripoli': 'Триполи',

  // South America
  'Buenos Aires': 'Буэнос-Айрес', 'Santiago': 'Сантьяго', 'Bogota': 'Богота',
  'Lima': 'Лима', 'Caracas': 'Каракас', 'Montevideo': 'Монтевидео', 'Quito': 'Кито',

  // Other Asia
  'Bangkok': 'Бангкок', 'Ho Chi Minh City': 'Хошимин', 'Hanoi': 'Ханой',
  'Manila': 'Манила', 'Jakarta': 'Джакарта', 'Kuala Lumpur': 'Куала-Лумпур',
  'Singapore': 'Сингапур', 'Taipei': 'Тайбэй',
  'Phnom Penh': 'Пномпень', 'Vientiane': 'Вьентьян', 'Kathmandu': 'Катманду',

  // Oceania
  'Auckland': 'Окленд', 'Wellington': 'Веллингтон', 'Christchurch': 'Крайстчерч',
}

export const COUNTRIES_DATA: Record<string, CountryData> = {
  'RU': { name: 'Россия', phoneCode: '+7', phoneFormat: 'XXX XXX-XX-XX', maxDigits: 10 },
  'US': { name: 'США', phoneCode: '+1', phoneFormat: '(XXX) XXX-XXXX', maxDigits: 10 },
  'GB': { name: 'Великобритания', phoneCode: '+44', phoneFormat: 'XXXX XXX XXXX', maxDigits: 10 },
  'DE': { name: 'Германия', phoneCode: '+49', phoneFormat: 'XXX XXXXX XX', maxDigits: 10 },
  'FR': { name: 'Франция', phoneCode: '+33', phoneFormat: 'X XX XX XX XX', maxDigits: 9 },
  'IT': { name: 'Италия', phoneCode: '+39', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'ES': { name: 'Испания', phoneCode: '+34', phoneFormat: 'XXX XX XX XX', maxDigits: 9 },
  'UA': { name: 'Украина', phoneCode: '+380', phoneFormat: 'XX XXX XX XX', maxDigits: 9 },
  'PL': { name: 'Польша', phoneCode: '+48', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'CA': { name: 'Канада', phoneCode: '+1', phoneFormat: '(XXX) XXX-XXXX', maxDigits: 10 },
  'JP': { name: 'Япония', phoneCode: '+81', phoneFormat: 'XX-XXXX-XXXX', maxDigits: 10 },
  'KZ': { name: 'Казахстан', phoneCode: '+7', phoneFormat: 'XXX XXX-XX-XX', maxDigits: 10 },
  'TR': { name: 'Турция', phoneCode: '+90', phoneFormat: 'XXX XXX XX XX', maxDigits: 10 },
  'CN': { name: 'Китай', phoneCode: '+86', phoneFormat: 'XXX XXXX XXXX', maxDigits: 11 },
  'IN': { name: 'Индия', phoneCode: '+91', phoneFormat: 'XXXXX XXXXX', maxDigits: 10 },
  'BR': { name: 'Бразилия', phoneCode: '+55', phoneFormat: '(XX) XXXXX-XXXX', maxDigits: 11 },
  'AU': { name: 'Австралия', phoneCode: '+61', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'KR': { name: 'Южная Корея', phoneCode: '+82', phoneFormat: 'XX-XXXX-XXXX', maxDigits: 10 },
  'MX': { name: 'Мексика', phoneCode: '+52', phoneFormat: 'XX XXXX XXXX', maxDigits: 10 },
  'AE': { name: 'ОАЭ', phoneCode: '+971', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'NL': { name: 'Нидерланды', phoneCode: '+31', phoneFormat: 'X XX XX XX XX', maxDigits: 9 },
  'SE': { name: 'Швеция', phoneCode: '+46', phoneFormat: 'XX-XXX XX XX', maxDigits: 9 },
  'CH': { name: 'Швейцария', phoneCode: '+41', phoneFormat: 'XX XXX XX XX', maxDigits: 9 },
  'BE': { name: 'Бельгия', phoneCode: '+32', phoneFormat: 'XXX XX XX XX', maxDigits: 9 },
  'AT': { name: 'Австрия', phoneCode: '+43', phoneFormat: 'XXX XXXXXX', maxDigits: 10 },
  'GR': { name: 'Греция', phoneCode: '+30', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'PT': { name: 'Португалия', phoneCode: '+351', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'CZ': { name: 'Чехия', phoneCode: '+420', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'RO': { name: 'Румыния', phoneCode: '+40', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'HU': { name: 'Венгрия', phoneCode: '+36', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'BY': { name: 'Беларусь', phoneCode: '+375', phoneFormat: 'XX XXX-XX-XX', maxDigits: 9 },
  'BG': { name: 'Болгария', phoneCode: '+359', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'RS': { name: 'Сербия', phoneCode: '+381', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'HR': { name: 'Хорватия', phoneCode: '+385', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'SK': { name: 'Словакия', phoneCode: '+421', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'NO': { name: 'Норвегия', phoneCode: '+47', phoneFormat: 'XXX XX XXX', maxDigits: 8 },
  'DK': { name: 'Дания', phoneCode: '+45', phoneFormat: 'XX XX XX XX', maxDigits: 8 },
  'FI': { name: 'Финляндия', phoneCode: '+358', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'IE': { name: 'Ирландия', phoneCode: '+353', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'LT': { name: 'Литва', phoneCode: '+370', phoneFormat: 'XXX XX XXX', maxDigits: 8 },
  'LV': { name: 'Латвия', phoneCode: '+371', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'EE': { name: 'Эстония', phoneCode: '+372', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'SI': { name: 'Словения', phoneCode: '+386', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'BA': { name: 'Босния и Герцеговина', phoneCode: '+387', phoneFormat: 'XX XXX-XXX', maxDigits: 8 },
  'MK': { name: 'Северная Македония', phoneCode: '+389', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'ME': { name: 'Черногория', phoneCode: '+382', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'AL': { name: 'Албания', phoneCode: '+355', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'MD': { name: 'Молдова', phoneCode: '+373', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'GE': { name: 'Грузия', phoneCode: '+995', phoneFormat: 'XXX XX XX XX', maxDigits: 9 },
  'AM': { name: 'Армения', phoneCode: '+374', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'AZ': { name: 'Азербайджан', phoneCode: '+994', phoneFormat: 'XX XXX XX XX', maxDigits: 9 },
  'UZ': { name: 'Узбекистан', phoneCode: '+998', phoneFormat: 'XX XXX XX XX', maxDigits: 9 },
  'KG': { name: 'Кыргызстан', phoneCode: '+996', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'TJ': { name: 'Таджикистан', phoneCode: '+992', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'TM': { name: 'Туркменистан', phoneCode: '+993', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'IL': { name: 'Израиль', phoneCode: '+972', phoneFormat: 'XX-XXX-XXXX', maxDigits: 9 },
  'SA': { name: 'Саудовская Аравия', phoneCode: '+966', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'EG': { name: 'Египет', phoneCode: '+20', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'IR': { name: 'Иран', phoneCode: '+98', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'IQ': { name: 'Ирак', phoneCode: '+964', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'JO': { name: 'Иордания', phoneCode: '+962', phoneFormat: 'X XXXX XXXX', maxDigits: 9 },
  'LB': { name: 'Ливан', phoneCode: '+961', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'SY': { name: 'Сирия', phoneCode: '+963', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'QA': { name: 'Катар', phoneCode: '+974', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'KW': { name: 'Кувейт', phoneCode: '+965', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'BH': { name: 'Бахрейн', phoneCode: '+973', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'OM': { name: 'Оман', phoneCode: '+968', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'PK': { name: 'Пакистан', phoneCode: '+92', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'AF': { name: 'Афганистан', phoneCode: '+93', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'BD': { name: 'Бангладеш', phoneCode: '+880', phoneFormat: 'XXXX-XXXXXX', maxDigits: 10 },
  'LK': { name: 'Шри-Ланка', phoneCode: '+94', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'MM': { name: 'Мьянма', phoneCode: '+95', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'TH': { name: 'Таиланд', phoneCode: '+66', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'VN': { name: 'Вьетнам', phoneCode: '+84', phoneFormat: 'XX XXXX XXXX', maxDigits: 10 },
  'PH': { name: 'Филиппины', phoneCode: '+63', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'ID': { name: 'Индонезия', phoneCode: '+62', phoneFormat: 'XXX-XXXX-XXXX', maxDigits: 11 },
  'MY': { name: 'Малайзия', phoneCode: '+60', phoneFormat: 'XX-XXXX XXXX', maxDigits: 10 },
  'SG': { name: 'Сингапур', phoneCode: '+65', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'TW': { name: 'Тайвань', phoneCode: '+886', phoneFormat: 'XXXX XXXXXX', maxDigits: 9 },
  'KH': { name: 'Камбоджа', phoneCode: '+855', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'LA': { name: 'Лаос', phoneCode: '+856', phoneFormat: 'XX XX XXX XXX', maxDigits: 10 },
  'NP': { name: 'Непал', phoneCode: '+977', phoneFormat: 'XX-XXX-XXXX', maxDigits: 10 },
  'NZ': { name: 'Новая Зеландия', phoneCode: '+64', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'AR': { name: 'Аргентина', phoneCode: '+54', phoneFormat: 'XX XXXX-XXXX', maxDigits: 10 },
  'CL': { name: 'Чили', phoneCode: '+56', phoneFormat: 'X XXXX XXXX', maxDigits: 9 },
  'CO': { name: 'Колумбия', phoneCode: '+57', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'PE': { name: 'Перу', phoneCode: '+51', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'VE': { name: 'Венесуэла', phoneCode: '+58', phoneFormat: 'XXX-XXX-XXXX', maxDigits: 10 },
  'EC': { name: 'Эквадор', phoneCode: '+593', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'BO': { name: 'Боливия', phoneCode: '+591', phoneFormat: 'X XXX XXXX', maxDigits: 8 },
  'PY': { name: 'Парагвай', phoneCode: '+595', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'UY': { name: 'Уругвай', phoneCode: '+598', phoneFormat: 'X XXX XX XX', maxDigits: 8 },
  'CU': { name: 'Куба', phoneCode: '+53', phoneFormat: 'X XXX XXXX', maxDigits: 8 },
  'DO': { name: 'Доминиканская Республика', phoneCode: '+1-809', phoneFormat: '(XXX) XXX-XXXX', maxDigits: 10 },
  'JM': { name: 'Ямайка', phoneCode: '+1-876', phoneFormat: '(XXX) XXX-XXXX', maxDigits: 10 },
  'TT': { name: 'Тринидад и Тобаго', phoneCode: '+1-868', phoneFormat: '(XXX) XXX-XXXX', maxDigits: 10 },
  'CR': { name: 'Коста-Рика', phoneCode: '+506', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'PA': { name: 'Панама', phoneCode: '+507', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'GT': { name: 'Гватемала', phoneCode: '+502', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'HN': { name: 'Гондурас', phoneCode: '+504', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'SV': { name: 'Сальвадор', phoneCode: '+503', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'NI': { name: 'Никарагуа', phoneCode: '+505', phoneFormat: 'XXXX-XXXX', maxDigits: 8 },
  'ZA': { name: 'ЮАР', phoneCode: '+27', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'NG': { name: 'Нигерия', phoneCode: '+234', phoneFormat: 'XXX XXX XXXX', maxDigits: 10 },
  'KE': { name: 'Кения', phoneCode: '+254', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'GH': { name: 'Гана', phoneCode: '+233', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'TZ': { name: 'Танзания', phoneCode: '+255', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'ET': { name: 'Эфиопия', phoneCode: '+251', phoneFormat: 'XX XXX XXXX', maxDigits: 9 },
  'DZ': { name: 'Алжир', phoneCode: '+213', phoneFormat: 'XXX XX XX XX', maxDigits: 9 },
  'MA': { name: 'Марокко', phoneCode: '+212', phoneFormat: 'XX-XXX-XXXX', maxDigits: 9 },
  'TN': { name: 'Тунис', phoneCode: '+216', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'CY': { name: 'Кипр', phoneCode: '+357', phoneFormat: 'XX XXX XXX', maxDigits: 8 },
  'MT': { name: 'Мальта', phoneCode: '+356', phoneFormat: 'XXXX XXXX', maxDigits: 8 },
  'LU': { name: 'Люксембург', phoneCode: '+352', phoneFormat: 'XXX XXX XXX', maxDigits: 9 },
  'IS': { name: 'Исландия', phoneCode: '+354', phoneFormat: 'XXX XXXX', maxDigits: 7 },
  'MN': { name: 'Монголия', phoneCode: '+976', phoneFormat: 'XX XX XXXX', maxDigits: 8 },
}

export function getCountryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

// English country names
const COUNTRY_NAMES_EN: Record<string, string> = {
  'RU': 'Russia', 'US': 'United States', 'GB': 'United Kingdom', 'DE': 'Germany',
  'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'UA': 'Ukraine', 'PL': 'Poland',
  'CA': 'Canada', 'JP': 'Japan', 'KZ': 'Kazakhstan', 'TR': 'Turkey', 'CN': 'China',
  'IN': 'India', 'BR': 'Brazil', 'AU': 'Australia', 'KR': 'South Korea', 'MX': 'Mexico',
  'AE': 'United Arab Emirates', 'NL': 'Netherlands', 'SE': 'Sweden', 'CH': 'Switzerland',
  'BE': 'Belgium', 'AT': 'Austria', 'GR': 'Greece', 'PT': 'Portugal', 'CZ': 'Czech Republic',
  'RO': 'Romania', 'HU': 'Hungary', 'BY': 'Belarus', 'BG': 'Bulgaria', 'RS': 'Serbia',
  'HR': 'Croatia', 'SK': 'Slovakia', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
  'IE': 'Ireland', 'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia',
  'BA': 'Bosnia and Herzegovina', 'MK': 'North Macedonia', 'ME': 'Montenegro', 'AL': 'Albania',
  'MD': 'Moldova', 'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan', 'UZ': 'Uzbekistan',
  'KG': 'Kyrgyzstan', 'TJ': 'Tajikistan', 'TM': 'Turkmenistan', 'IL': 'Israel',
  'SA': 'Saudi Arabia', 'EG': 'Egypt', 'IR': 'Iran', 'IQ': 'Iraq', 'JO': 'Jordan',
  'LB': 'Lebanon', 'SY': 'Syria', 'QA': 'Qatar', 'KW': 'Kuwait', 'BH': 'Bahrain',
  'OM': 'Oman', 'PK': 'Pakistan', 'AF': 'Afghanistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
  'MM': 'Myanmar', 'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'ID': 'Indonesia',
  'MY': 'Malaysia', 'SG': 'Singapore', 'TW': 'Taiwan', 'KH': 'Cambodia', 'LA': 'Laos',
  'NP': 'Nepal', 'NZ': 'New Zealand', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia',
  'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador', 'BO': 'Bolivia', 'PY': 'Paraguay',
  'UY': 'Uruguay', 'CU': 'Cuba', 'DO': 'Dominican Republic', 'JM': 'Jamaica',
  'TT': 'Trinidad and Tobago', 'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala',
  'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua', 'ZA': 'South Africa',
  'NG': 'Nigeria', 'KE': 'Kenya', 'GH': 'Ghana', 'TZ': 'Tanzania', 'ET': 'Ethiopia',
  'DZ': 'Algeria', 'MA': 'Morocco', 'TN': 'Tunisia', 'CY': 'Cyprus', 'MT': 'Malta',
  'LU': 'Luxembourg', 'IS': 'Iceland', 'MN': 'Mongolia',
}

// Azerbaijani country names
const COUNTRY_NAMES_AZ: Record<string, string> = {
  'RU': 'Rusiya', 'US': 'ABŞ', 'GB': 'Böyük Britaniya', 'DE': 'Almaniya',
  'FR': 'Fransa', 'IT': 'İtaliya', 'ES': 'İspaniya', 'UA': 'Ukrayna', 'PL': 'Polşa',
  'CA': 'Kanada', 'JP': 'Yaponiya', 'KZ': 'Qazaxıstan', 'TR': 'Türkiyə', 'CN': 'Çin',
  'IN': 'Hindistan', 'BR': 'Braziliya', 'AU': 'Avstraliya', 'KR': 'Cənubi Koreya', 'MX': 'Meksika',
  'AE': 'BƏƏ', 'NL': 'Niderland', 'SE': 'İsveç', 'CH': 'İsveçrə',
  'BE': 'Belçika', 'AT': 'Avstriya', 'GR': 'Yunanıstan', 'PT': 'Portuqaliya', 'CZ': 'Çexiya',
  'RO': 'Rumıniya', 'HU': 'Macarıstan', 'BY': 'Belarus', 'BG': 'Bolqarıstan', 'RS': 'Serbiya',
  'HR': 'Xorvatiya', 'SK': 'Slovakiya', 'NO': 'Norveç', 'DK': 'Danimarka', 'FI': 'Finlandiya',
  'IE': 'İrlandiya', 'LT': 'Litva', 'LV': 'Latviya', 'EE': 'Estoniya', 'SI': 'Sloveniya',
  'BA': 'Bosniya və Herseqovina', 'MK': 'Şimali Makedoniya', 'ME': 'Monteneqro', 'AL': 'Albaniya',
  'MD': 'Moldova', 'GE': 'Gürcüstan', 'AM': 'Ermənistan', 'AZ': 'Azərbaycan', 'UZ': 'Özbəkistan',
  'KG': 'Qırğızıstan', 'TJ': 'Tacikistan', 'TM': 'Türkmənistan', 'IL': 'İsrail',
  'SA': 'Səudiyyə Ərəbistanı', 'EG': 'Misir', 'IR': 'İran', 'IQ': 'İraq', 'JO': 'İordaniya',
  'LB': 'Livan', 'SY': 'Suriya', 'QA': 'Qətər', 'KW': 'Küveyt', 'BH': 'Bəhreyn',
  'OM': 'Oman', 'PK': 'Pakistan', 'AF': 'Əfqanıstan', 'BD': 'Banqladeş', 'LK': 'Şri-Lanka',
  'MM': 'Myanma', 'TH': 'Tayland', 'VN': 'Vyetnam', 'PH': 'Filippin', 'ID': 'İndoneziya',
  'MY': 'Malayziya', 'SG': 'Sinqapur', 'TW': 'Tayvan', 'KH': 'Kamboca', 'LA': 'Laos',
  'NP': 'Nepal', 'NZ': 'Yeni Zelandiya', 'AR': 'Argentina', 'CL': 'Çili', 'CO': 'Kolumbiya',
  'PE': 'Peru', 'VE': 'Venesuela', 'EC': 'Ekvador', 'BO': 'Boliviya', 'PY': 'Paraqvay',
  'UY': 'Uruqvay', 'CU': 'Kuba', 'DO': 'Dominikan Respublikası', 'JM': 'Yamayka',
  'TT': 'Trinidad və Tobaqo', 'CR': 'Kosta-Rika', 'PA': 'Panama', 'GT': 'Qvatemala',
  'HN': 'Honduras', 'SV': 'Salvador', 'NI': 'Nikaraqua', 'ZA': 'Cənubi Afrika',
  'NG': 'Nigeriya', 'KE': 'Keniya', 'GH': 'Qana', 'TZ': 'Tanzaniya', 'ET': 'Efiopiya',
  'DZ': 'Əlcəzair', 'MA': 'Mərakeş', 'TN': 'Tunis', 'CY': 'Kipr', 'MT': 'Malta',
  'LU': 'Lüksemburq', 'IS': 'İslandiya', 'MN': 'Monqolustan',
}

// Azerbaijani city translations (key cities)
const CITY_TRANSLATIONS_AZ: Record<string, string> = {
  // Azerbaijan
  'Baku': 'Bakı', 'Ganja': 'Gəncə', 'Sumqayit': 'Sumqayıt', 'Mingachevir': 'Mingəçevir',
  'Lankaran': 'Lənkəran', 'Sheki': 'Şəki', 'Shirvan': 'Şirvan', 'Nakhchivan': 'Naxçıvan',
  // Turkey
  'Istanbul': 'İstanbul', 'Ankara': 'Ankara', 'Izmir': 'İzmir', 'Bursa': 'Bursa',
  'Antalya': 'Antalya', 'Adana': 'Adana', 'Konya': 'Konya', 'Gaziantep': 'Qaziantep',
  // Russia
  'Moscow': 'Moskva', 'Saint Petersburg': 'Sankt-Peterburq',
  // Georgia
  'Tbilisi': 'Tbilisi', 'Batumi': 'Batumi', 'Kutaisi': 'Kutaisi',
}

// Get country name by code and language
export function getCountryName(code: string, lang: string = 'ru'): string {
  if (lang === 'en') return COUNTRY_NAMES_EN[code] || COUNTRIES_DATA[code]?.name || code
  if (lang === 'az') return COUNTRY_NAMES_AZ[code] || COUNTRY_NAMES_EN[code] || COUNTRIES_DATA[code]?.name || code
  return COUNTRIES_DATA[code]?.name || code
}

export interface CityOption {
  value: string  // original English name (stable key)
  label: string  // translated display name
}

// Latin → Cyrillic transliteration map (handles Azerbaijani/Turkish special chars)
const LATIN_TO_CYRILLIC: Record<string, string> = {
  // Multi-char patterns (checked first)
  'sh': 'ш', 'Sh': 'Ш', 'SH': 'Ш',
  'ch': 'ч', 'Ch': 'Ч', 'CH': 'Ч',
  'zh': 'ж', 'Zh': 'Ж', 'ZH': 'Ж',
  'kh': 'х', 'Kh': 'Х', 'KH': 'Х',
  'ts': 'ц', 'Ts': 'Ц', 'TS': 'Ц',
  'ya': 'я', 'Ya': 'Я', 'YA': 'Я',
  'yu': 'ю', 'Yu': 'Ю', 'YU': 'Ю',
  'ye': 'е', 'Ye': 'Е', 'YE': 'Е',
  'yo': 'ё', 'Yo': 'Ё', 'YO': 'Ё',
}

const LATIN_TO_CYRILLIC_SINGLE: Record<string, string> = {
  // Azerbaijani/Turkish special characters
  'ə': 'э', 'Ə': 'Э', 'ğ': 'г', 'Ğ': 'Г',
  'ı': 'ы', 'İ': 'И', 'ö': 'ё', 'Ö': 'Ё',
  'ü': 'ю', 'Ü': 'Ю', 'ç': 'ч', 'Ç': 'Ч',
  'ş': 'ш', 'Ş': 'Ш',
  // Standard Latin → Cyrillic
  'a': 'а', 'A': 'А', 'b': 'б', 'B': 'Б',
  'c': 'дж', 'C': 'Дж', 'd': 'д', 'D': 'Д',
  'e': 'е', 'E': 'Е', 'f': 'ф', 'F': 'Ф',
  'g': 'г', 'G': 'Г', 'h': 'х', 'H': 'Х',
  'i': 'и', 'I': 'И', 'j': 'дж', 'J': 'Дж',
  'k': 'к', 'K': 'К', 'l': 'л', 'L': 'Л',
  'm': 'м', 'M': 'М', 'n': 'н', 'N': 'Н',
  'o': 'о', 'O': 'О', 'p': 'п', 'P': 'П',
  'q': 'г', 'Q': 'Г', 'r': 'р', 'R': 'Р',
  's': 'с', 'S': 'С', 't': 'т', 'T': 'Т',
  'u': 'у', 'U': 'У', 'v': 'в', 'V': 'В',
  'w': 'в', 'W': 'В', 'x': 'х', 'X': 'Х',
  'y': 'й', 'Y': 'Й', 'z': 'з', 'Z': 'З',
}

// Transliterate Latin text to Cyrillic (fallback for untranslated cities)
function transliterateToCyrillic(text: string): string {
  let result = ''
  let i = 0
  while (i < text.length) {
    // Try 2-char patterns first
    if (i + 1 < text.length) {
      const pair = text.substring(i, i + 2)
      if (LATIN_TO_CYRILLIC[pair]) {
        result += LATIN_TO_CYRILLIC[pair]
        i += 2
        continue
      }
    }
    // Try single char
    const ch = text[i]
    if (LATIN_TO_CYRILLIC_SINGLE[ch]) {
      result += LATIN_TO_CYRILLIC_SINGLE[ch]
    } else {
      result += ch // keep spaces, hyphens, digits, etc.
    }
    i++
  }
  return result
}

// Function to get cities for a country with translations based on language
export function getCitiesForCountry(countryCode: string, lang: string = 'ru'): CityOption[] {
  const cities = City.getCitiesOfCountry(countryCode)

  if (!cities || cities.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const result: CityOption[] = []

  for (const city of cities) {
    if (seen.has(city.name)) continue
    seen.add(city.name)

    let label: string
    if (lang === 'az') {
      label = CITY_TRANSLATIONS_AZ[city.name] || city.name
    } else if (lang === 'ru') {
      label = CITY_TRANSLATIONS[city.name] || city.name
    } else {
      label = city.name
    }

    result.push({ value: city.name, label })
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, lang))
}

// Translate a single city name for a given language (useful when submitting forms)
export function translateCityName(englishName: string, lang: string = 'ru'): string {
  if (lang === 'az') return CITY_TRANSLATIONS_AZ[englishName] || englishName
  if (lang === 'ru') return CITY_TRANSLATIONS[englishName] || englishName
  return englishName
}

// Get sorted list of countries for a given language
export function getCountries(lang: string = 'ru') {
  return Object.entries(COUNTRIES_DATA)
    .map(([code]) => ({
      code,
      name: getCountryName(code, lang),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang))
}

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Baku': 'AZ',
  'Asia/Tbilisi': 'GE',
  'Asia/Yerevan': 'AM',
  'Asia/Almaty': 'KZ',
  'Asia/Aqtau': 'KZ',
  'Asia/Aqtobe': 'KZ',
  'Asia/Atyrau': 'KZ',
  'Asia/Oral': 'KZ',
  'Asia/Bishkek': 'KG',
  'Asia/Tashkent': 'UZ',
  'Asia/Dushanbe': 'TJ',
  'Asia/Ashgabat': 'TM',
  'Europe/Moscow': 'RU',
  'Europe/Samara': 'RU',
  'Europe/Volgograd': 'RU',
  'Europe/Kaliningrad': 'RU',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Novosibirsk': 'RU',
  'Asia/Omsk': 'RU',
  'Asia/Krasnoyarsk': 'RU',
  'Asia/Irkutsk': 'RU',
  'Asia/Yakutsk': 'RU',
  'Asia/Vladivostok': 'RU',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Minsk': 'BY',
  'Europe/Warsaw': 'PL',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Prague': 'CZ',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Dublin': 'IE',
  'Europe/Istanbul': 'TR',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'Asia/Dubai': 'AE',
  'Asia/Seoul': 'KR',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'CN',
  'Asia/Kolkata': 'IN',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
}

function resolveCountryCodeCandidate(candidate?: string | null): string | null {
  if (!candidate) return null
  const normalized = candidate.toUpperCase()
  return normalized in COUNTRIES_DATA ? normalized : null
}

function getCountryCodeFromLocale(locale?: string | null): string | null {
  if (!locale) return null

  const normalizedLocale = locale.replace('_', '-')
  const parts = normalizedLocale.split('-')

  // Ignore the primary language subtag and only treat explicit region subtags as countries.
  // This prevents plain locales like "ru" from being misread as Russia.
  const regionParts = parts.slice(1)

  for (let index = regionParts.length - 1; index >= 0; index -= 1) {
    const part = regionParts[index]
    if (/^[A-Za-z]{2}$/.test(part)) {
      const resolved = resolveCountryCodeCandidate(part)
      if (resolved) return resolved
    }
  }

  return null
}

export function detectPreferredCountryCode(localeHint?: string): string | null {
  if (typeof window === 'undefined') return null

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const fromTimeZone = TIMEZONE_TO_COUNTRY[timeZone]
  if (fromTimeZone) return fromTimeZone

  const browserLocales = [
    ...(navigator.languages || []),
    navigator.language,
  ].filter(Boolean) as string[]

  for (const locale of browserLocales) {
    const fromLocale = getCountryCodeFromLocale(locale)
    if (fromLocale) return fromLocale
  }

  const hintedLocale = getCountryCodeFromLocale(localeHint)
  return hintedLocale || null
}

// Resolve country code from a stored country name in any supported language.
export function resolveCountryCodeByName(countryName?: string | null): string | null {
  if (!countryName) return null
  const normalized = countryName.trim().toLowerCase()

  for (const code of Object.keys(COUNTRIES_DATA)) {
    const candidates = [
      getCountryName(code, 'en'),
      getCountryName(code, 'ru'),
      getCountryName(code, 'az'),
      COUNTRIES_DATA[code]?.name,
    ]

    if (candidates.some(name => (name || '').trim().toLowerCase() === normalized)) {
      return code
    }
  }

  return null
}

// Translate a stored country value to the current app language when possible.
export function localizeCountryName(countryName?: string | null, lang: string = 'ru'): string {
  if (!countryName) return ''
  const code = resolveCountryCodeByName(countryName)
  return code ? getCountryName(code, lang) : countryName
}

// Translate a stored city value to the current app language when possible.
export function localizeCityName(cityName?: string | null, countryName?: string | null, lang: string = 'ru'): string {
  if (!cityName) return ''

  const code = resolveCountryCodeByName(countryName)
  if (!code) return cityName

  const normalized = cityName.trim().toLowerCase()
  const cities = getCitiesForCountry(code, lang)

  const match = cities.find(city => {
    const value = city.value.trim().toLowerCase()
    const label = city.label.trim().toLowerCase()
    const ru = translateCityName(city.value, 'ru').trim().toLowerCase()
    const az = translateCityName(city.value, 'az').trim().toLowerCase()
    const en = translateCityName(city.value, 'en').trim().toLowerCase()
    return value === normalized || label === normalized || ru === normalized || az === normalized || en === normalized
  })

  return match ? match.label : cityName
}

// Get sorted list of countries (Russian - backward compat)
export const COUNTRIES = Object.entries(COUNTRIES_DATA)
  .map(([code, data]) => ({
    code,
    name: data.name,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

// Get unique phone codes
export const PHONE_CODES = Array.from(
  new Set(Object.values(COUNTRIES_DATA).map(c => c.phoneCode))
).sort((a, b) => {
  const numA = parseInt(a.replace(/\D/g, ''))
  const numB = parseInt(b.replace(/\D/g, ''))
  return numA - numB
})

// Format phone number based on country format
export function formatPhoneNumber(value: string, format: string): string {
  const digits = value.replace(/\D/g, '')
  let formatted = ''
  let digitIndex = 0

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex]
      digitIndex++
    } else {
      formatted += format[i]
    }
  }

  return formatted
}

// Validate phone number length
export function validatePhoneNumber(value: string, maxDigits: number): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === maxDigits
}
