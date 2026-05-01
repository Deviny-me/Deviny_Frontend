import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Deviny',
  description: 'Deviny',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
try{
  var langKey='deviny.language';
  var themeKey='theme';
  var lang=localStorage.getItem(langKey);
  var isSupported=lang==='ru'||lang==='en'||lang==='az';
  if(isSupported){
    document.documentElement.lang=lang;
    var metaByLang={
      ru:{title:'Deviny - Социальная сеть для фитнеса',description:'Социальная сеть для фитнеса и здорового образа жизни'},
      en:{title:'Deviny - Social Network for Fitness',description:'Social network for fitness and healthy lifestyle'},
      az:{title:'Deviny - Fitness Sosial Şəbəkəsi',description:'Fitness və sağlam həyat tərzi üçün sosial şəbəkə'}
    };
    var meta=metaByLang[lang];
    if(meta){
      document.title=meta.title;
      var d=document.querySelector('meta[name="description"]');
      if(!d){d=document.createElement('meta');d.setAttribute('name','description');document.head.appendChild(d);}
      d.setAttribute('content',meta.description);
    }
  }

  var t=localStorage.getItem(themeKey);
  if(t!=='light'){document.documentElement.classList.add('dark');}
}catch(e){}
})()`
          }}
        />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
