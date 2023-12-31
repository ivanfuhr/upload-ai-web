import { api } from "@/lib/axios";
import { getFFpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util';
import { FileVideo, RefreshCcw, Upload, Youtube } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success'

const statusMessages = {
  converting: 'Convertendo...',
  uploading: 'Carregando...',
  generating: 'Transcrevendo...',
  success: 'Sucesso!'
}

type VideoFormFileProps = {
  onVideoUploaded: (videoId: string | null) => void
}

export function VideoInputForm({ onVideoUploaded }: VideoFormFileProps) {

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'upload' | 'youtube'>('upload')

  const [status, setStatus] = useState<Status>('waiting');

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      toast.error('Selecione um vídeo')
      return
    }

    const selectedFile = files[0]
    setVideoFile(selectedFile)
  }

  function handleResetFields() 
  {
    if (promptInputRef.current) {
      promptInputRef.current.value = ''
    }

    if (youtubeInputRef.current) {
      youtubeInputRef.current.value = ''
    }

    setVideoFile(null)
    setStatus('waiting')
    onVideoUploaded(null)
  }

  async function convertVideoToAudio(video: File) {
    console.log('Convert started')

    const ffmpeg = await getFFpeg();
    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    ffmpeg.on('progress', (progress) => {
      console.log(`Convert progress: ${Math.round(progress.progress * 100)}%`)
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')
    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    })

    console.log('Convert finished')
    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = promptInputRef.current?.value;

    let videoId = null

    if (uploadType == 'upload') {

      if (!videoFile) {
        toast.error('Selecione um vídeo')
        return
      }

      setStatus('converting')
      const audioFile = await convertVideoToAudio(videoFile);

      const data = new FormData();
      data.append('file', audioFile);
      data.append('prompt', prompt || '');

      setStatus('uploading')
      const response = await api.post('/videos', data);
      videoId = response.data.video.id;
    } else {
      const youtubeUrl = youtubeInputRef.current?.value;

      if (!youtubeUrl) {
        toast.error('Insira a URL do vídeo do youtube')
        return
      }

      setStatus('uploading')
      const response = await api.post('/youtube', { url: youtubeUrl, prompt });
      videoId = response.data.video.id;
    }

    setStatus('generating')
    await api.post(`/videos/${videoId}/transcription`, {
      prompt
    })

    setStatus('success')
    onVideoUploaded(videoId)
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    } else {
      return URL.createObjectURL(videoFile)
    }
  }, [videoFile])

  return (
    <form className='space-y-6' onSubmit={handleUploadVideo}>
      <div className='space-y-2'>
        <Label>Como deseja enviar o vídeo?</Label>
        <Tabs defaultValue="upload" className='w-full'>
          <TabsList className='w-full'>
            <TabsTrigger value="upload" className='w-1/2 flex gap-1' onClick={() => setUploadType('upload')} disabled={status !== 'waiting'}>
              <Upload className='h-4 w-4' />
              Upload
            </TabsTrigger>

            <TabsTrigger value="youtube" className='w-1/2 flex gap-1' onClick={() => setUploadType('youtube')} disabled={status !== 'waiting'}>
              <Youtube className='h-4 w-4' />
              Youtube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <label htmlFor="video" className='relative border flex rounded-md aspect-video cursor-pointer border-dashed text-small flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5'>
              {previewURL ? (<video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />) : (
                <>
                  <FileVideo className='h-4 w-4' />
                  Selecione um vídeo
                </>
              )}
            </label>
            <input type="file" id="video" accept='video/mp4' className='sr-only' onChange={handleFileSelected} />
          </TabsContent>
          <TabsContent value="youtube">
            <div className='space-y-2'>
              <Label>URL do vídeo</Label>
              <Input ref={youtubeInputRef} disabled={status !== 'waiting'} placeholder='Insira a URL do vídeo do youtube' />
            </div>
          </TabsContent>
        </Tabs>
      </div>


      <Separator />

      <div className='space-y-2'>
        <Label htmlFor='transcription_prompt'>Prompt de transcrição</Label>

        <Textarea
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          id='transcription_prompt'
          className='h-20 leading-relaxed resize-none'
          placeholder='Inclua palavras-chaves relacionadas no vídeo separadas por vírgula (,) *'
        />
      </div>

      <div className="space-y-2">
        <Button
          data-success={status === 'success'}
          disabled={status !== 'waiting'}
          type='submit'
          className='w-full data-[success=true]:bg-emerald-400'
        >
          {
            status === 'waiting' ? (
              <>
                Carregar vídeo
                <Upload className='w-4 h-4 ml-2' />
              </>
            ) : statusMessages[status]
          }

        </Button>

        {
          status === 'success' && (
            <Button variant='outline' className='w-full' onClick={handleResetFields}>
              <RefreshCcw className='w-4 h-4 mr-2' /> Carregar outro vídeo
            </Button>
          )
        }
      </div>
    </form>
  )
}