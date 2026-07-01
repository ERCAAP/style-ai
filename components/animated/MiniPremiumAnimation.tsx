// MiniPremiumAnimation - Premium icon animasyonu (Header badge için)

import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface MiniPremiumAnimationProps {
  size?: number;
}

export function MiniPremiumAnimation({
  size = wp('7%'),
}: MiniPremiumAnimationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require('@/assets/images/Onboarding-Animation/premium icon.json')}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
