import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Button, Card, TextInput, Title, Paragraph, RadioButton } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { useWallet } from '@solana/wallet-adapter-react'
import Toast from 'react-native-toast-message'

export const ScheduledScreen: React.FC = () => {
  const navigation = useNavigation()
  const { publicKey } = useWallet()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenType, setTokenType] = useState<'SOL' | 'PYUSD'>('SOL')
  const [chargeType, setChargeType] = useState<'OneTime' | 'Recurring'>('OneTime')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!publicKey) {
      Alert.alert('Error', 'Wallet not connected')
      return
    }

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

      // TODO: Implement scheduled payment creation
      await new Promise(resolve => setTimeout(resolve, 2000))

      Toast.show({
        type: 'success',
        text1: 'Scheduled Payment Created!',
        text2: `${chargeType} payment has been scheduled`,
      })

      setRecipient('')
      setAmount('')
      setMemo('')
      navigation.goBack()

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to schedule payment',
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
          <Title style={styles.title}>Schedule Payment</Title>
          <Paragraph style={styles.subtitle}>
            Automate recurring or one-time payments
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
            label="Amount per Payment"
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

          <View style={styles.chargeTypeContainer}>
            <Paragraph style={styles.chargeTypeLabel}>Payment Type:</Paragraph>
            <RadioButton.Group onValueChange={value => setChargeType(value as 'OneTime' | 'Recurring')} value={chargeType}>
              <View style={styles.radioContainer}>
                <RadioButton value="OneTime" />
                <Paragraph onPress={() => setChargeType('OneTime')} style={styles.radioLabel}>One-time</Paragraph>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="Recurring" />
                <Paragraph onPress={() => setChargeType('Recurring')} style={styles.radioLabel}>Recurring</Paragraph>
              </View>
            </RadioButton.Group>
          </View>

          <TextInput
            label="Description (Optional)"
            value={memo}
            onChangeText={setMemo}
            mode="outlined"
            placeholder="Payment description..."
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
              {isLoading ? 'Scheduling...' : 'Schedule Payment'}
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
  chargeTypeContainer: {
    marginBottom: 16,
  },
  chargeTypeLabel: {
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