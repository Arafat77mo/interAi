
import { Language } from './types';

export const LANGUAGES: Language[] = [
  // Backend & Core Languages
  {
    id: 'php',
    name: { en: 'PHP', ar: 'بي إتش بي (PHP)' },
    icon: '🐘',
    description: { en: 'Server-side scripting for web development.', ar: 'برمجة الخوادم لتطوير الويب.' }
  },
  {
    id: 'laravel',
    name: { en: 'Laravel', ar: 'لارافيل (Laravel)' },
    icon: '🏗️',
    description: { en: 'The elegant PHP framework for web artisans.', ar: 'إطار عمل PHP الأنيق للمبدعين.' }
  },
  {
    id: 'python',
    name: { en: 'Python', ar: 'بايثون (Python)' },
    icon: '🐍',
    description: { en: 'Versatile language for AI, Data, and Backend.', ar: 'لغة متعددة الاستخدامات للذكاء الاصطناعي والبيانات.' }
  },
  {
    id: 'django',
    name: { en: 'Django', ar: 'ديجانغو (Django)' },
    icon: '🎸',
    description: { en: 'The web framework for perfectionists with deadlines.', ar: 'إطار عمل بايثون المتطور للمشاريع السريعة.' }
  },
  {
    id: 'flask',
    name: { en: 'Flask', ar: 'فلاسك (Flask)' },
    icon: '🧪',
    description: { en: 'Lightweight WSGI web application framework.', ar: 'إطار عمل بايثون مصغر ومرن.' }
  },
  {
    id: 'node',
    name: { en: 'Node.js', ar: 'نود جي إس (Node.js)' },
    icon: '🟢',
    description: { en: 'JavaScript runtime built on Chrome\'s V8 engine.', ar: 'بيئة تشغيل جافا سكريبت لبناء أنظمة سريعة.' }
  },
  {
    id: 'java',
    name: { en: 'Java', ar: 'جافا (Java)' },
    icon: '☕',
    description: { en: 'High-level, class-based object-oriented language.', ar: 'لغة برمجية قوية وواسعة الانتشار في الشركات.' }
  },
  {
    id: 'springboot',
    name: { en: 'Spring Boot', ar: 'سبرينج بوت (Spring Boot)' },
    icon: '🍃',
    description: { en: 'Enterprise-level microservices and web apps.', ar: 'إطار عمل جافا للخدمات المصغرة والأنظمة الكبيرة.' }
  },
  {
    id: 'csharp',
    name: { en: 'C# / .NET', ar: 'سي شارب / دوت نت' },
    icon: '🔷',
    description: { en: 'Modern language for Windows, Cloud, and Mobile.', ar: 'لغة برمجية حديثة من مايكروسوفت لكافة المنصات.' }
  },
  {
    id: 'go',
    name: { en: 'Go (Golang)', ar: 'جو (Go)' },
    icon: '🐹',
    description: { en: 'Open source language for scalable infrastructure.', ar: 'لغة برمجية من جوجل لبناء أنظمة سحابية فعالة.' }
  },
  {
    id: 'rust',
    name: { en: 'Rust', ar: 'رست (Rust)' },
    icon: '🦀',
    description: { en: 'Performance, reliability, and memory safety.', ar: 'لغة تركز على الأداء العالي وأمان الذاكرة.' }
  },
  {
    id: 'cpp',
    name: { en: 'C++', ar: 'سي بلس بلس (C++)' },
    icon: '⚙️',
    description: { en: 'General-purpose programming for system systems.', ar: 'لغة الأنظمة والبرامج التي تتطلب أداءً فائقاً.' }
  },
  {
    id: 'ruby',
    name: { en: 'Ruby on Rails', ar: 'روبي أون ريلز' },
    icon: '💎',
    description: { en: 'Full-stack framework for startup speed.', ar: 'إطار عمل متكامل يركز على سرعة التطوير.' }
  },

  // Frontend & Web
  {
    id: 'javascript',
    name: { en: 'JavaScript', ar: 'جافا سكريبت' },
    icon: '🟨',
    description: { en: 'The language of the web browser.', ar: 'اللغة الأساسية لبرمجة متصفحات الويب.' }
  },
  {
    id: 'typescript',
    name: { en: 'TypeScript', ar: 'تايب سكريبت' },
    icon: '🟦',
    description: { en: 'Strongly typed programming language for JS.', ar: 'جافا سكريبت مع نظام أنواع للأنظمة الكبيرة.' }
  },
  {
    id: 'react',
    name: { en: 'React', ar: 'رياكت (React)' },
    icon: '⚛️',
    description: { en: 'Library for building user interfaces.', ar: 'مكتبة بناء واجهات المستخدم من ميتا.' }
  },
  {
    id: 'nextjs',
    name: { en: 'Next.js', ar: 'نيكست جي إس (Next.js)' },
    icon: '▲',
    description: { en: 'The React framework for production.', ar: 'إطار عمل رياكت المتطور لدعم محركات البحث والأداء.' }
  },
  {
    id: 'vue',
    name: { en: 'Vue.js', ar: 'فيو (Vue.js)' },
    icon: '🟢',
    description: { en: 'The progressive JavaScript framework.', ar: 'إطار عمل ويب مرن وسهل التعلم.' }
  },
  {
    id: 'angular',
    name: { en: 'Angular', ar: 'أنجولار (Angular)' },
    icon: '🅰️',
    description: { en: 'Platform for building mobile and desktop web.', ar: 'منصة متكاملة لبناء تطبيقات الويب الضخمة.' }
  },
  {
    id: 'svelte',
    name: { en: 'Svelte', ar: 'سيفيلت (Svelte)' },
    icon: '🧡',
    description: { en: 'Cybernetically enhanced web apps.', ar: 'طريقة جديدة لبناء واجهات الويب بدون Virtual DOM.' }
  },
  {
    id: 'htmlcss',
    name: { en: 'HTML & CSS', ar: 'إتش تي إم إل / سي إس إس' },
    icon: '🎨',
    description: { en: 'The skeleton and skin of every website.', ar: 'أساسيات هيكلة وتصميم صفحات الويب.' }
  },

  // Mobile & Cross-Platform
  {
    id: 'swift',
    name: { en: 'Swift (iOS)', ar: 'سويفت (Swift)' },
    icon: '🍎',
    description: { en: 'Powerful language for Apple platforms.', ar: 'اللغة الرسمية لتطوير تطبيقات آيفون وآبل.' }
  },
  {
    id: 'kotlin',
    name: { en: 'Kotlin (Android)', ar: 'كوتلن (Kotlin)' },
    icon: '🤖',
    description: { en: 'Modern language for Android development.', ar: 'اللغة الحديثة والمفضلة لتطوير تطبيقات أندرويد.' }
  },
  {
    id: 'flutter',
    name: { en: 'Flutter', ar: 'فلاتر (Flutter)' },
    icon: '💙',
    description: { en: 'Multi-platform UI toolkit from Google.', ar: 'إطار عمل من جوجل لبناء تطبيقات لكافة المنصات بكود واحد.' }
  },
  {
    id: 'reactnative',
    name: { en: 'React Native', ar: 'رياكت نيتف' },
    icon: '📱',
    description: { en: 'Native apps using React and JavaScript.', ar: 'بناء تطبيقات أصلية للجوال باستخدام رياكت.' }
  },

  // Data & Infrastructure
  {
    id: 'sql',
    name: { en: 'SQL (PostgreSQL/MySQL)', ar: 'قواعد البيانات (SQL)' },
    icon: '🗄️',
    description: { en: 'Standard language for relational databases.', ar: 'اللغة القياسية لإدارة واستعلام قواعد البيانات.' }
  },
  {
    id: 'mongodb',
    name: { en: 'NoSQL (MongoDB)', ar: 'مونجو دي بي' },
    icon: '🍃',
    description: { en: 'Document database for modern apps.', ar: 'قواعد بيانات مرنة تعتمد على المستندات.' }
  }
];
