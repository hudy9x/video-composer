export class FFmpegCommandBuilder {
  private args: string[] = [];
  private inputFile: string = '';
  private outputFile: string = '';

  input(file: string): this {
    this.inputFile = file;
    return this;
  }

  videoFilter(filterChain: string): this {
    this.args.push('-vf', filterChain);
    return this;
  }

  codec(v: string): this {
    this.args.push('-c:v', v);
    return this;
  }

  preset(p: string): this {
    this.args.push('-preset', p);
    return this;
  }

  crf(value: number): this {
    this.args.push('-crf', value.toString());
    return this;
  }

  copyAudio(): this {
    this.args.push('-c:a', 'copy');
    return this;
  }

  overwrite(): this {
    this.args.push('-y');
    return this;
  }

  output(file: string): this {
    this.outputFile = file;
    return this;
  }

  build(): string[] {
    const command: string[] = [];
    
    // Add input
    if (this.inputFile) {
      command.push('-i', this.inputFile);
    }
    
    // Add all other arguments
    command.push(...this.args);
    
    // Add output
    if (this.outputFile) {
      command.push(this.outputFile);
    }
    
    return command;
  }
}
