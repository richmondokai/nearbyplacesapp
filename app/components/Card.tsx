import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  padding = 16, 
  style, 
  ...props 
}) => {
  return (
    <View 
      style={[styles.card, { padding }, style]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
