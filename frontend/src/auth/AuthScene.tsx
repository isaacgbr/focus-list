import { useId } from 'react'

// Cena vetorial provisória; pode ser substituída por uma ilustração 3D definitiva.
export function AuthScene({ register }: { register: boolean }) {
  const id = useId()
  return (
    <svg className="auth-scene" viewBox="0 0 440 350" role="img" aria-label={register
      ? 'Pessoa diante do computador começando a organizar suas atividades.'
      : 'Pessoa concentrada usando o FocusList em um computador, em sua mesa de trabalho.'}>
      <defs>
        <linearGradient id={`${id}-desk`} x2="0.8" y2="1"><stop stopColor="#315575" /><stop offset="1" stopColor="#182f48" /></linearGradient>
        <linearGradient id={`${id}-shirt`} x2="1" y2="1"><stop stopColor="#518ed1" /><stop offset="1" stopColor="#244f85" /></linearGradient>
        <linearGradient id={`${id}-screen`} x2="1" y2="1"><stop stopColor="#173854" /><stop offset="1" stopColor="#091a2c" /></linearGradient>
      </defs>
      {register ? <g>
        {/* Espaço em construção: painel vertical e blocos em uma hierarquia visual. */}
        <ellipse cx="224" cy="303" rx="181" ry="31" fill="#030c18" opacity=".45" />
        <path d="M33 251 204 161 417 263 246 347Z" fill="#11263d" stroke="#294561" />
        <path d="m215 262 19-10 104 52-19 10Z" fill="#172f49" stroke="#34516d" />
        <path d="M231 213v48l12 6v-48m75 37v47l12 6v-47" fill="#213f5d" stroke="#466886" />
        <path d="m186 38 9-5 177 88v154l-9 5-177-88Z" fill={`url(#${id}-desk)`} stroke="#4c6b88" strokeLinejoin="round" />
        <path d="m186 38 177 88v154l-177-88Z" fill="#071322" stroke="#51718e" strokeWidth="3" strokeLinejoin="round" />
        <path d="m195 52 159 79v135l-159-79Z" fill={`url(#${id}-screen)`} />
        <g transform="matrix(1 .5 0 1 203 60)">
          <image href="/focuslist-mark.png" x="0" y="0" width="14" height="14" />
          <path d="M23 7h65" stroke="#adc7df" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 24h142" stroke="#34516d" />
          <rect x="9" y="35" width="105" height="24" rx="3" fill="#254564" stroke="#4b6d8e" />
          <path d="m16 42 5 2 4-2 5 2v9H16Z" fill="#7097bc" />
          <path d="M38 47h59" stroke="#8baece" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 60v18h14m12 12v20h14" fill="none" stroke="#51718e" strokeLinejoin="round" />
          <rect x="35" y="68" width="96" height="23" rx="3" fill="#1b3855" stroke="#416384" />
          <path d="M44 76h9m-9 6h9m8-6h53m-53 6h35" stroke="#7097bc" strokeWidth="2" strokeLinecap="round" />
          <rect x="61" y="100" width="77" height="22" rx="3" fill="none" stroke="#628ab2" strokeDasharray="3 4" />
          <path d="M91 111h15m-7-7v14" stroke="#628ab2" strokeWidth="1.5" />
        </g>
        {/* Bloco levemente destacado do painel, guiado pela mão do personagem. */}
        <path d="m196 165 6-3 76 38v22l-6 3-76-38Z" fill="#3c5e7b" />
        <path d="m196 165 76 38v22l-76-38Z" fill="#315b85" stroke="#709bc7" strokeLinejoin="round" />
        <g transform="matrix(1 .5 0 1 204 174)">
          <rect width="9" height="9" rx="2" fill="#173854" stroke="#8baece" />
          <path d="M17 4h41" stroke="#adc7df" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Poucos módulos no chão sugerem os próximos elementos a organizar. */}
        <path d="m64 254 24-12 29 14-24 13Z" fill="#315575" stroke="#4c6b88" />
        <path d="M64 254v12l29 15 24-13v-12l-24 13Z" fill="#1a334e" stroke="#34516d" />
        <path d="m72 240 17-9 23 11-17 9Z" fill="#406685" stroke="#6a87a1" />
        <path d="M72 240v8l23 12 17-10v-8l-17 9Z" fill="#254564" stroke="#4c6b88" />
        {/* Pessoa em pé, de lado, alcançando a interface com o braço elevado. */}
        <ellipse cx="146" cy="312" rx="44" ry="11" fill="#030c18" opacity=".4" />
        <path d="m123 226 22 7-8 68-15 1-2-41Z" fill="#152b44" />
        <path d="m144 232 19-8 5 34-9 48-15-3 4-45Z" fill="#0a192a" />
        <path d="m122 297 15 1 7 11q1 5-7 5l-21-4q-3-5 6-13Zm23 3 14 3 15 8q4 7-5 8l-25-7Z" fill="#07121e" stroke="#38516b" />
        <path d="M119 175q9-13 26-7l14 9q8 6 7 22l-4 29q-21 12-43-1Z" fill={`url(#${id}-shirt)`} />
        <path d="m129 181-9 21 19 21" fill="none" stroke="#3d78b5" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m135 219 12 1 6 8-9 4-10-7Z" fill="#b79989" />
        <path d="m153 184 20 17 27-19" fill="none" stroke="#568fc8" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m194 180 12-8 7 4-5 9-11 3Z" fill="#b79989" />
        <path d="m132 156-1 16q7 7 16 2l2-17" fill="#a88879" />
        <path d="M121 135q0-22 21-20 20 3 18 22l4 9-8 3-3 14q-14 9-28-5Z" fill="#c0a293" />
        <path d="M121 148q-12-23 3-34 14-9 30 1l7 14-16-3-9 14-7-2-2 15Z" fill="#172438" />
      </g> : <>
      {/* Plataforma e mesa em perspectiva isométrica. */}
      <ellipse cx="224" cy="303" rx="181" ry="31" fill="#030c18" opacity=".45" />
      <path d="M33 251 204 161 417 263 246 347Z" fill="#11263d" stroke="#294561" />
      <path d="M78 198v81l12 6v-81m282-4v79l-12 7v-80M226 266v64l12 6v-65" fill="#13283e" stroke="#34516d" strokeWidth="2" />
      <path d="m62 185 151-76 176 88-151 78Z" fill={`url(#${id}-desk)`} stroke="#4c6b88" />
      <path d="M62 185v10l176 90 151-78v-10l-151 78Z" fill="#172f49" />
      {/* Tela com uma visão simplificada de listas do produto. */}
      <path d="m258 184 1 28 23 12 19-10-26-12v-27" fill="#3c5e7b" />
      <path d="m214 74 115 57v94l-115-57Z" fill="#071322" stroke="#51718e" strokeWidth="3" strokeLinejoin="round" />
      <path d="m222 86 99 49v77l-99-49Z" fill={`url(#${id}-screen)`} />
      <g transform="matrix(1 .5 0 1 228 94)">
        <image href="/focuslist-mark.png" x="0" y="0" width="12" height="12" />
        <path d="M19 5h54" stroke="#adc7df" strokeWidth="3" strokeLinecap="round" />
        <path d="M0 22h18m-18 9h13m-13 9h16m-16 9h11" stroke="#4a6a88" strokeWidth="2" strokeLinecap="round" />
        <path d="M27 21h54v12H27Zm0 20h54v12H27Z" fill="#254564" />
        <path d="M43 27h30m-30 20h24" stroke="#8baece" strokeWidth="2" strokeLinecap="round" />
        {register ? <path d="M33 25v4m-2-2h4" stroke="#8bbdff" strokeWidth="1.5" /> : <path d="m31 26 2 2 4-4" stroke="#8bbdff" strokeWidth="1.5" fill="none" />}
        {!register ? <path d="M27 61h37" stroke="#416d99" strokeWidth="3" strokeLinecap="round" /> : null}
      </g>
      {/* Teclado, caderno e luminária discretos. */}
      <path d="m228 214 39-20 51 26-39 20Z" fill="#152b42" stroke="#5a7691" />
      <path d="m239 215 26-13m-17 18 26-13m-16 18 26-13" stroke="#4b6d8e" strokeWidth="2" />
      <path d="m315 190 20-10 26 13-20 11Z" fill={register ? '#7097bc' : '#3b6084'} />
      <path d="m324 190 11-5m-6 9 11-5" stroke="#bed2e5" opacity=".6" />
      <ellipse cx="137" cy="163" rx="19" ry="9" fill="#102239" stroke="#4c6984" />
      <path d="M137 162v-61l25-13" fill="none" stroke="#6a87a1" strokeWidth="4" strokeLinecap="round" />
      <path d="m151 85 19-7 14 15-26 12Z" fill="#406685" />
      <path d="m158 105 26-12-12 30Z" fill="#8ab6df" opacity=".08" />
      {/* Pessoa adulta sentada; volumes simples, sem animação ou ornamentos. */}
      <path d="m167 246 36 16-10 43-16 2 3-37-27-7" fill="#0a192a" />
      <path d="m145 254 25 13-17 37-16-4 10-28-18-8" fill="#152b44" />
      <path d="m177 300 17-3 13 11q2 6-7 7l-24-5Zm-41-4 16 4 7 11q0 6-9 4l-21-10Z" fill="#07121e" stroke="#38516b" />
      <path d="M122 193q5-27 29-22l20 10q14 8 14 29l-7 39q-27 9-57-15Z" fill={`url(#${id}-shirt)`} />
      <path d="m163 190 23 26 33-10" fill="none" stroke="#3d78b5" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m211 208 16-6 9 4-13 8Z" fill="#b79989" />
      <path d="m135 192 7 35 39 9" fill="none" stroke="#568fc8" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m179 231 14-4 12 7-12 7-14-3Z" fill="#b79989" />
      <path d="m145 163-1 13q6 9 16 3l2-18" fill="#a88879" />
      <path d="M137 142q0-22 22-20 23 3 17 29l-5 18q-15 12-29-6Z" fill="#c0a293" />
      <path d="M137 153q-13-24 4-34 15-10 32 3l6 14-19-4-10 16-6-3-1 13Z" fill="#172438" />
      <path d="M114 214q-1-10 8-8l25 13q9 4 9 13v27l-42-19Z" fill="#1a334e" stroke="#466886" strokeWidth="2" />
      <path d="M114 240v12l42 20 27-14v-10l-27 12Z" fill="#213f5d" />
      <path d="M149 266v34m0-2-23 12m23-12 23 12" stroke="#48617b" strokeWidth="4" strokeLinecap="round" />
      {register ? <g stroke="#709bc7" strokeWidth="1.5" fill="none" opacity=".7">
        <path d="m351 115 13 6v17l-13-6Zm3 9 3 3 4-4m-10 21 13 6m-13 2 9 4" />
      </g> : null}
      </>}
    </svg>
  )
}
