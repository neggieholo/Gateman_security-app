import { registerWebModule, NativeModule } from 'expo';

// LocationModule is not available on the web platform.
class LocationModule extends NativeModule<{}> {}

export default registerWebModule(LocationModule, 'LocationModule');
