// Mock for React Native in tests
const RN = jest.requireActual('react-native');

RN.Image = 'Image';
RN.View = 'View';
RN.Text = 'Text';
RN.TouchableOpacity = 'TouchableOpacity';
RN.StyleSheet = {
  ...RN.StyleSheet,
  create: (styles) => styles,
};

module.exports = RN;
