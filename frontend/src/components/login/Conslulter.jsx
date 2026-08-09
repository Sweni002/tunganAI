import React, { useState } from 'react'
import styles from './consulter.module.css'
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // Styles par défaut


const Conslulter = () => {
      const [date, setDate] = useState(new Date()); // date sélectionnée

  const handleChange = (newDate) => {
    setDate(newDate);
  };

  return (
    <div className={styles.card}>
        <div className={styles.container}>
            <div className={styles.dates}>
 <Calendar
        onChange={handleChange}
        value={date}
        
        locale="fr-FR"  // pour afficher en français
      />
    <p style={{ marginTop: 10, fontWeight: '500' }}>
  Date sélectionnée : {date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
</p>
         </div>

        </div>
        
    </div>
  )
}

export default Conslulter