import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DemandInputProps {
  onSubmit: (text: string) => void;
}

const DemandInput = ({ onSubmit }: DemandInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-b border-border px-4 py-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="O que precisa ser feito?"
        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] resize-none outline-none min-h-[60px]"
        rows={2}
      />
      <div className="flex justify-end mt-2">
        <Button 
          onClick={handleSubmit} 
          disabled={!text.trim()}
          size="sm"
        >
          Publicar
        </Button>
      </div>
    </div>
  );
};

export default DemandInput;
