module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(ttf|otf|xml|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
