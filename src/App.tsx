import { useCompletion } from 'ai/react';
import { AlertTriangle, Github, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { PromptSelect } from './components/prompt-select';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from "./components/ui/button";
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Slider } from './components/ui/slider';
import { Textarea } from './components/ui/textarea';
import { VideoInputForm } from './components/video-input-form';

export function App() {
  const [temperature, setTemperature] = useState(0.5);
  const [videoId, setVideoId] = useState<string | null>(null);

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading
  } = useCompletion({
    api: `${import.meta.env.VITE_API_PATH}/ai/complete`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      videoId,
      temperature
    }
  })

  return (
    <div className='min-h-screen flex flex-col'>
      <header className="px-6 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold flex flex-col gap-2 lg:flex-row lg:items-center justify-center">
          upload.ai
          <span className="text-sm text-muted-foreground">Desenvolvido com ❤️ no NLW da <a href="https://www.rocketseat.com.br/" target='_blank' title="Site da rocketseat">Rocketseat</a></span>
        </h1>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href="https://github.com/ivanfuhr/upload-ai-web" title="Ver o repositório do projeto" target='_blank'>
              <Github className='w-4 h-4 mr-2' />
              Github
            </a>
          </Button>
        </div>
      </header>

      <main className='flex-1 p-6 flex gap-6 flex-col md:flex-row'>
        <section className='flex flex-col flex-1 gap-4'>
          <div className='grid grid-rows-2 gap-4 flex-1'>
            <Textarea
              placeholder='Inclua o prompt para a IA...'
              className='resize-none p-4 leading-relaxed min-h-[120px]'
              value={input}
              onChange={handleInputChange}
            />

            <Textarea
              placeholder='Resultado gerado pela IA'
              className='resize-none p-4 leading-relaxed'
              value={completion}
              readOnly
            />
          </div>

          <p className='text-sm text-muted-foreground'>
            Lembre-se: você pode utilizar a variável <code className='text-rose-400'>{'{transcription}'}</code> no seu prompt para adicionar o conteúdo da transcrição do vídeo selecionado
          </p>
        </section>

        <aside className='space-y-6 w-full md:w-80'>

          <VideoInputForm onVideoUploaded={setVideoId} />

          <Separator />

          <form className='space-y-6' onSubmit={handleSubmit}>
            <div className='space-y-2'>
              <Label>Prompt</Label>
              <PromptSelect onPromptSelected={setInput} />
            </div>

            <div className='space-y-2'>
              <Label>Modelo</Label>
              <Select disabled defaultValue='gpt-3-5-turbo-16k'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value='gpt-3-5-turbo-16k'>GPT 3.5-turbo 16k</SelectItem>
                </SelectContent>
              </Select>

              <span className='block text-xs text-muted-foreground italic'>
                Você poderá customizar essa opção em breve
              </span>
            </div>

            <Separator />

            <div className='space-y-4'>
              <Label>Temperatura</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={value => setTemperature(value[0])}
              />

              <span className='block text-xs text-muted-foreground italic leading-relaxed'>
                Valores mais altos tendem a deixar o resultados mais criativo e com possíveis erros
              </span>
            </div>

            <Separator />

            <div className='space-y-2'>
              {
                !videoId && (
                  <Alert>                 
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Faça um upload!</AlertTitle>
                    <AlertDescription>
                      Você precisa fazer o upload de um vídeo para poder utilizar a IA
                    </AlertDescription>
                  </Alert>
                )
              }

              <Button type='submit' className='w-full' disabled={isLoading || !videoId}>
                Executar
                <Wand2 className='h-4 w-4 ml-2' />
              </Button>
            </div>



          </form>
        </aside>
      </main>
    </div>
  )
}
