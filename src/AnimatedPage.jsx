// src/AnimatedPage.jsx

import { motion } from 'framer-motion';

const animations = {
  initial: { opacity: 0, y: 10 }, // Mudei para o eixo Y e diminuí a distância
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

const AnimatedPage = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`w-full min-w-0 max-w-full overflow-x-hidden ${className}`.trim()}
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