import { api } from "@/lib/axios";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Prompt = {
  id: string
  title: string
  template: string
}

type PromptSelectProps = {
  onPromptSelected: (template: string) => void
}

export function PromptSelect({ onPromptSelected }: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])

  function handlePromptSelected(promptId: string) {
    const prompt = prompts.find(prompt => prompt.id === promptId)

    if (!prompt) {
      return
    }

    onPromptSelected(prompt.template)
  }

  useEffect(() => {
    api.get('/prompts')
      .then(response => setPrompts(response.data))
  }, [])

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt" />
      </SelectTrigger>

      <SelectContent>
        {prompts?.map(prompt => <SelectItem value={prompt.id} key={prompt.id}>{prompt.title}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}