import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { Provider as PaperProvider } from 'react-native-paper'
import Toast from 'react-native-toast-message'

import { WalletProvider } from './lib/WalletProvider'
import { AnalyticsProvider } from './lib/AnalyticsProvider'
import { HomeScreen } from './screens/HomeScreen'
import { PaymentScreen } from './screens/PaymentScreen'
import { RequestScreen } from './screens/RequestScreen'
import { ScheduledScreen } from './screens/ScheduledScreen'

export type RootStackParamList = {
  Home: undefined
  Payment: undefined
  Request: undefined
  Scheduled: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const App: React.FC = () => {
  return (
    <AnalyticsProvider>
      <WalletProvider>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#1f2937',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'BlinkPay Mobile' }}
              />
              <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{ title: 'Send Payment' }}
              />
              <Stack.Screen
                name="Request"
                component={RequestScreen}
                options={{ title: 'Request Payment' }}
              />
              <Stack.Screen
                name="Scheduled"
                component={ScheduledScreen}
                options={{ title: 'Schedule Payment' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </PaperProvider>
      </WalletProvider>
    </AnalyticsProvider>
  )
}

export default App