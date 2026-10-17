import React from 'react';
import { LandingPage } from './LandingPage';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenRegister?: () => void;
  onEnterSpectator?: () => void;
  onOpenWatchList?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onOpenRegister = () => {},
  onEnterSpectator,
  onOpenWatchList,
}) => {
  return (
    <LandingPage
      onSuccess={onSuccess}
      onOpenRegister={onOpenRegister}
      onEnterSpectator={onEnterSpectator || onOpenWatchList}
    />
  );
};
