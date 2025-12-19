import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Button, Card, TextInput, Title, Paragraph, RadioButton } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { useWallet } from '@solana/wallet-adapter-react'
import Toast from 'react-native-toast-message'

import { SOL_MINT, PYUSD_MINT } from '../lib/config'
import { trackEvent, trackError } from '../lib/AnalyticsProvider'

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation()
  const { publicKey } = useWallet()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenType, setTokenType] = useState<'SOL' | 'PYUSD'>('SOL')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!publicKey) {
      Alert.alert('Error', 'Wallet not connected')
      return
    }

    // Validation
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter recipient address')
      return
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    try {
      setIsLoading(true)

      // Track analytics
      trackEvent('payment_initiated', {
        token_type: tokenType,
        amount: parseFloat(amount),
      })

      // TODO: Implement actual payment logic
      // This would integrate with the BlinkPay smart contract

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Success
      trackEvent('payment_completed', {
        token_type: tokenType,
        amount: parseFloat(amount),
      })

      Toast.show({
        type: 'success',
        text1: 'Payment Sent!',
        text2: `Successfully sent ${amount} ${tokenType}`,
      })

      // Reset form
      setRecipient('')
      setAmount('')
      setMemo('')

      navigation.goBack()

    } catch (error: any) {
      trackError(error, {
        action: 'payment',
        token_type: tokenType,
        amount: parseFloat(amount),
      })

      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: error.message || 'Something went wrong',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Send Payment</Title>
          <Paragraph style={styles.subtitle}>
            Transfer tokens directly to any Solana address
          </Paragraph>

          <TextInput
            label="Recipient Address"
            value={recipient}
            onChangeText={setRecipient}
            mode="outlined"
            placeholder="Enter Solana address..."
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={styles.tokenTypeContainer}>
            <Paragraph style={styles.tokenTypeLabel}>Token Type:</Paragraph>
            <RadioButton.Group onValueChange={value => setTokenType(value as 'SOL' | 'PYUSD')} value={tokenType}>
              <View style={styles.radioContainer}>
                <RadioButton value="SOL" />
                <Paragraph onPress={() => setTokenType('SOL')} style={styles.radioLabel}>SOL</Paragraph>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="PYUSD" />
                <Paragraph onPress={() => setTokenType('PYUSD')} style={styles.radioLabel}>PYUSD</Paragraph>
              </View>
            </RadioButton.Group>
          </View>

          <TextInput
            label="Memo (Optional)"
            value={memo}
            onChangeText={setMemo}
            mode="outlined"
            placeholder="Add a note..."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.memoInput]}
            maxLength={200}
          />
          <Paragraph style={styles.charCount}>{memo.length}/200</Paragraph>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.cancelButton]}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, styles.sendButton]}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Payment'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  tokenTypeContainer: {
    marginBottom: 16,
  },
  tokenTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    marginLeft: 8,
  },
  memoInput: {
    height: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: '#d1d5db',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
  },
})