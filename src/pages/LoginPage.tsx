import React from 'react';
import { LandingPage } from './LandingPage';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenRegister?: () => void;
  onEnterSpectator?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onOpenRegister = () => {},
  onEnterSpectator,
}) => {
  return (
    <LandingPage
      onSuccess={onSuccess}
      onOpenRegister={onOpenRegister}
      onEnterSpectator={onEnterSpectator}
    />
  );
};
