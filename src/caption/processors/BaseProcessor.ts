import { TextOverlay } from '@/caption/type';

export abstract class BaseProcessor {
  protected nextProcessor?: BaseProcessor;

  setNext(processor: BaseProcessor): BaseProcessor {
    this.nextProcessor = processor;
    return processor;
  }

  process(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result = this.handleProcess(overlays, context);
    
    if (this.nextProcessor) {
      return this.nextProcessor.process(result, context);
    }
    
    return result;
  }

  protected abstract handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[];
}

export interface ProcessingContext {
  videoHeight: number;
  videoWidth?: number;
}
