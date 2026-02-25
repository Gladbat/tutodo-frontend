import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit {
  @Input() appLazyLoadImage: string = '';
  @Input() placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18"%3ECargando...%3C/text%3E%3C/svg%3E';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    // Establecer placeholder inmediatamente
    this.el.nativeElement.src = this.placeholder;
    this.el.nativeElement.classList.add('lazy-loading');

    // Crear observer para detectar cuando la imagen entra en viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        rootMargin: '50px' // Comenzar a cargar 50px antes de que sea visible
      }
    );

    observer.observe(this.el.nativeElement);
  }

  private loadImage(): void {
    const img = new Image();
    img.src = this.appLazyLoadImage;

    img.onload = () => {
      this.el.nativeElement.src = this.appLazyLoadImage;
      this.el.nativeElement.classList.remove('lazy-loading');
      this.el.nativeElement.classList.add('lazy-loaded');
    };

    img.onerror = () => {
      this.el.nativeElement.src = 'https://via.placeholder.com/400x300?text=Error+al+cargar';
      this.el.nativeElement.classList.remove('lazy-loading');
    };
  }
}