// App completo em React Native com Expo e Firebase

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, Text, View, Button, TextInput, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SUA_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Stack = createNativeStackNavigator();

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const login = () => {
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => navigation.navigate('Home'))
      .catch(() => Alert.alert('Erro', 'Email ou senha inválidos'));
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-4">
      <Text className="text-xl mb-4">Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} className="border w-full mb-2 p-2 rounded" />
      <TextInput placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} className="border w-full mb-4 p-2 rounded" />
      <Button title="Entrar" onPress={login} />
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Button title="Cadastro de Técnicos" onPress={() => navigation.navigate('Tecnicos')} />
      <Button title="Cadastro de Pacientes" onPress={() => navigation.navigate('Pacientes')} />
      <Button title="Iniciar Distribuição" onPress={() => navigation.navigate('Selecao')} />
    </SafeAreaView>
  );
}

function TecnicosScreen() {
  const [nome, setNome] = useState('');
  const [restricao, setRestricao] = useState(false);
  const [tecnicos, setTecnicos] = useState([]);

  const carregarTecnicos = async () => {
    const snapshot = await getDocs(collection(db, 'tecnicos'));
    setTecnicos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    carregarTecnicos();
  }, []);

  const adicionarTecnico = async () => {
    await addDoc(collection(db, 'tecnicos'), { nome, restricao });
    setNome('');
    setRestricao(false);
    carregarTecnicos();
  };

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Text className="text-lg">Cadastrar Técnico</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} className="border p-2 rounded mb-2" />
      <Button title={restricao ? "Com Restrição" : "Sem Restrição"} onPress={() => setRestricao(!restricao)} />
      <Button title="Salvar" onPress={adicionarTecnico} />
      <FlatList
        data={tecnicos}
        renderItem={({ item }) => <Text>{item.nome} - {item.restricao ? "Restrito" : "Livre"}</Text>}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

function PacientesScreen() {
  const [nome, setNome] = useState('');
  const [quarto, setQuarto] = useState('');
  const [escala, setEscala] = useState('');
  const [pacientes, setPacientes] = useState([]);

  const carregarPacientes = async () => {
    const snapshot = await getDocs(collection(db, 'pacientes'));
    setPacientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    carregarPacientes();
  }, []);

  const adicionarPaciente = async () => {
    await addDoc(collection(db, 'pacientes'), { nome, quarto, escala: Number(escala) });
    setNome('');
    setQuarto('');
    setEscala('');
    carregarPacientes();
  };

  const excluirPaciente = async (id) => {
    await deleteDoc(doc(db, 'pacientes', id));
    carregarPacientes();
  };

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Text className="text-lg">Cadastrar Paciente</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} className="border p-2 rounded mb-2" />
      <TextInput placeholder="Quarto" value={quarto} onChangeText={setQuarto} className="border p-2 rounded mb-2" />
      <TextInput placeholder="Escala Fugulin" value={escala} onChangeText={setEscala} keyboardType="numeric" className="border p-2 rounded mb-2" />
      <Button title="Salvar" onPress={adicionarPaciente} />
      <FlatList
        data={pacientes}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center py-2">
            <Text>{item.nome} ({item.quarto}) - {item.escala}</Text>
            <Button title="Excluir" onPress={() => excluirPaciente(item.id)} />
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

function SelecaoScreen({ navigation }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    const carregarTecnicos = async () => {
      const snapshot = await getDocs(collection(db, 'tecnicos'));
      setTecnicos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    carregarTecnicos();
  }, []);

  const toggleSelecionado = (id) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Text className="text-xl mb-4">Selecione os técnicos presentes</Text>
      <FlatList
        data={tecnicos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleSelecionado(item.id)} className="p-2 border mb-2 rounded" style={{ backgroundColor: selecionados.includes(item.id) ? '#cce5ff' : '#fff' }}>
            <Text>{item.nome} ({item.restricao ? 'Restrito' : 'Livre'})</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Avançar para Distribuição" onPress={() => navigation.navigate('Distribuicao', { tecnicosSelecionados: selecionados })} />
    </SafeAreaView>
  );
}

function DistribuicaoScreen({ route }) {
  const { tecnicosSelecionados } = route.params;
  const [distribuicao, setDistribuicao] = useState({});

  useEffect(() => {
    const distribuir = async () => {
      const snapshotTecnicos = await getDocs(collection(db, 'tecnicos'));
      const snapshotPacientes = await getDocs(collection(db, 'pacientes'));
      const tecnicos = snapshotTecnicos.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(t => tecnicosSelecionados.includes(t.id));
      const pacientes = snapshotPacientes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Distribuição simplificada (refinar lógica com regras do histórico e pontuação)
      const ordemTecnicos = [...tecnicos];
      const resultado = {};
      ordemTecnicos.forEach(t => resultado[t.nome] = []);

      let index = 0;
      pacientes.forEach(p => {
        const tecnico = ordemTecnicos[index];
        if (tecnico.restricao && p.escala >= 22) {
          let alternado = ordemTecnicos.find(t => !t.restricao);
          if (alternado) resultado[alternado.nome].push(p);
        } else {
          resultado[tecnico.nome].push(p);
          index = (index + 1) % ordemTecnicos.length;
        }
      });

      setDistribuicao(resultado);
    };
    distribuir();
  }, [tecnicosSelecionados]);

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-xl mb-4">Distribuição do Dia</Text>
      {Object.entries(distribuicao).map(([tecnico, pacientes]) => (
        <View key={tecnico} className="mb-4">
          <Text className="text-lg font-bold mb-2">{tecnico}</Text>
          {pacientes.map(p => (
            <Text key={p.id}>• {p.nome} - Quarto {p.quarto}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tecnicos" component={TecnicosScreen} />
        <Stack.Screen name="Pacientes" component={PacientesScreen} />
        <Stack.Screen name="Selecao" component={SelecaoScreen} />
        <Stack.Screen name="Distribuicao" component={DistribuicaoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
