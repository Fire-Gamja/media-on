import { Stack } from 'expo-router';

import { LegalAgreementGate } from '../../components/legal/LegalAgreementGate';

export default function AdminLayout() {
  return (
    <LegalAgreementGate>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </LegalAgreementGate>
  );
}
