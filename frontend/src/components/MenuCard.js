import React from 'react';
import styles from './MenuCard.module.css';

// In Login.js, Register.js, MenuPage.js etc.


const FALLBACK_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/annapurna-smart-canteen.appspot.com/o/menu-images%2Ffallback.png?alt=media&token=12345';

export default function MenuCard({ item, onAddToCart }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={item.imageUrl || FALLBACK_IMAGE}
          alt={item.name}
          className={styles.image}
          onError={(e) => e.target.src = FALLBACK_IMAGE}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.category}>{item.category}</span>
        <p className={styles.price}>₹{item.price.toFixed(2)}</p>
        <button
          onClick={() => onAddToCart(item)}
          className={styles.addToCart}
        >
          ➕ Add to Cart
        </button>
      </div>
    </div>
  );
}