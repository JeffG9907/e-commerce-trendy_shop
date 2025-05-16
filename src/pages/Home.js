import React from 'react';
import { Container } from '@mui/material';
import CategoryFilter from '../components/CategoryFilter';
import '../styles/Home.css';

const Home = () => {
  return (
    <Container maxWidth="lg" className="home-container">
      <CategoryFilter />
    </Container>
  );
};

export default Home;
