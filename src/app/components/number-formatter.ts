export class NumberFormatter {  
    static formatWithThousandSeparator(value: number): string {  
      if (isNaN(value)) return '0'; // Pour gérer les valeurs invalides  
      const parts = value.toString().split('.'); // Séparer la partie entière et la partie décimale  
      const integerPart = parts[0];  
  
      // Utiliser une expression régulière pour ajouter des espaces tous les trois chiffres à partir de la fin  
      const regex = /(\d)(?=(\d{3})+(?!\d))/g;  
      const formattedIntegerPart = integerPart.replace(regex, '$1 ');  
  
      // Vérifier s'il y a une partie décimale et la formater  
      if (parts.length > 1) {  
          return `${formattedIntegerPart}.${parts[1]}`;  
      }  
  
      return formattedIntegerPart;  
    }  
  }  