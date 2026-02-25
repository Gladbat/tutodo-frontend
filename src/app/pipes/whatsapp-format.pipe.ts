import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'whatsappFormat',
  standalone: true
})
export class WhatsappFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Remover +51 si existe
    let numero = value.replace('+51', '').replace(/\s/g, '');
    
    // Formatear: XXX XXX XXX
    if (numero.length === 9) {
      return `${numero.substring(0, 3)} ${numero.substring(3, 6)} ${numero.substring(6, 9)}`;
    }
    
    return numero;
  }
}
