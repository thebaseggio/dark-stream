// src/AnimatedPage.jsx

import { motion } from 'framer-motion';

const animations = {
  initial: { opacity: 0, x: 20 },  // Começa invisível e 20px à direita
  animate: { opacity: 1, x: 0 },    // Anima para totalmente visível e na posição original
  exit:    { opacity: 0, x: -20 }, // Sai para invisível e 20px à esquerda
};

const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }} // Duração da animação em segundos
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;