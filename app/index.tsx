import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  useColorScheme,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ToDoType = {
  id: number;
  title: string;
  isDone: boolean;
  date: string;
};

// Enable smooth list animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Index() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === "dark");
  const [todos, setTodos] = useState<ToDoType[]>([]);
  const [todoText, setTodoText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [oldTodos, setOldTodos] = useState<ToDoType[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const theme = isDark
    ? {
        background: "#121212",
        card: "#1E1E1E",
        text: "#FFFFFF",
        placeholder: "#AAAAAA",
        primary: "#BB86FC",
      }
    : {
        background: "#F4F6FB",
        card: "#FFFFFF",
        text: "#333333",
        placeholder: "#999999",
        primary: "#4C6EF5",
      };

  useEffect(() => {
    const getTodos = async () => {
      try {
        const todos = await AsyncStorage.getItem("my-todo");
        if (todos !== null) {
          setTodos(JSON.parse(todos));
          setOldTodos(JSON.parse(todos));
        }
      } catch (error) {
        console.log(error);
      }
    };
    getTodos();
  }, []);

  const saveTodos = async (updatedTodos: ToDoType[]) => {
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
    setTodos(updatedTodos);
    setOldTodos(updatedTodos);
  };

  const addTodo = async () => {
    try {
      if (!todoText.trim()) return;
      LayoutAnimation.easeInEaseOut();
      const newTodo = {
        id: Math.random(),
        title: todoText.trim(),
        isDone: false,
        date: new Date().toLocaleDateString(),
      };
      const newTodos = [...todos, newTodo];
      await saveTodos(newTodos);
      setTodoText("");
      Keyboard.dismiss();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTodo = async (id: number) => {
    LayoutAnimation.easeInEaseOut();
    const newTodos = todos.filter((todo) => todo.id !== id);
    await saveTodos(newTodos);
  };

  const handleDone = async (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
    );
    await saveTodos(newTodos);
  };

  const startEditing = (id: number, title: string) => {
    setEditingId(id);
    setTodoText(title);
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const newTodos = todos.map((todo) =>
      todo.id === editingId ? { ...todo, title: todoText.trim() } : todo
    );
    await saveTodos(newTodos);
    setEditingId(null);
    setTodoText("");
  };

  const clearCompleted = async () => {
    LayoutAnimation.easeInEaseOut();
    const newTodos = todos.filter((todo) => !todo.isDone);
    await saveTodos(newTodos);
  };

  const onSearch = (query: string) => {
    if (!query) return setTodos(oldTodos);
    const filtered = oldTodos.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase())
    );
    setTodos(filtered);
  };

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery]);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.isDone;
    if (filter === "completed") return todo.isDone;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>MindList</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Switch value={isDark} onValueChange={() => setIsDark(!isDark)} />
          <Image
            source={{ uri: "https://xsgames.co/randomusers/avatar.php?g=male" }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        </View>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterContainer}>
        {["all", "active", "completed"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === type ? theme.primary : "transparent",
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setFilter(type as any)}
          >
            <Text
              style={{
                color: filter === type ? "#fff" : theme.text,
                fontWeight: "600",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH */}
      <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={22} color={theme.text} />
        <TextInput
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {/* LIST */}
      <FlatList
        data={[...filteredTodos].reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ToDoItem
            todo={item}
            deleteTodo={deleteTodo}
            handleDone={handleDone}
            theme={theme}
            startEditing={startEditing}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.placeholder, textAlign: "center", marginTop: 50 }}>
            No tasks yet. Add one below 👇
          </Text>
        }
      />

      {/* FOOTER */}
      <KeyboardAvoidingView
        style={styles.footer}
        behavior="padding"
        keyboardVerticalOffset={10}
      >
        <TextInput
          placeholder={editingId ? "Edit ToDo..." : "Add New ToDo"}
          placeholderTextColor={theme.placeholder}
          value={todoText}
          onChangeText={setTodoText}
          style={[styles.newTodoInput, { backgroundColor: theme.card, color: theme.text }]}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={editingId ? saveEdit : addTodo}
        >
          <Ionicons name={editingId ? "save" : "add"} size={28} color={"#fff"} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* CLEAR COMPLETED */}
      {todos.some((t) => t.isDone) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
          <Text style={{ color: "red", fontWeight: "600" }}>Clear Completed</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const ToDoItem = ({
  todo,
  deleteTodo,
  handleDone,
  theme,
  startEditing,
}: {
  todo: ToDoType;
  deleteTodo: (id: number) => void;
  handleDone: (id: number) => void;
  startEditing: (id: number, title: string) => void;
  theme: any;
}) => (
  <View
    style={[
      styles.todoContainer,
      {
        backgroundColor: theme.card,
        borderColor: todo.isDone ? theme.primary : "#ccc",
        opacity: todo.isDone ? 0.6 : 1,
      },
    ]}
  >
    <View style={styles.todoInfoContainer}>
      <Checkbox
        value={todo.isDone}
        onValueChange={() => handleDone(todo.id)}
        color={todo.isDone ? theme.primary : undefined}
      />
      <TouchableOpacity onPress={() => startEditing(todo.id, todo.title)}>
        <Text
          style={[
            styles.todoText,
            { color: theme.text },
            todo.isDone && { textDecorationLine: "line-through" },
          ]}
        >
          {todo.title}
        </Text>
        <Text style={{ color: theme.placeholder, fontSize: 12 }}>{todo.date}</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
      <Ionicons name="trash-outline" size={22} color={"red"} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16 },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  todoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  todoInfoContainer: { flexDirection: "row", gap: 10, alignItems: "center" },
  todoText: { fontSize: 16, fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  newTodoInput: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  addButton: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    alignSelf: "center",
    marginBottom: 10,
    padding: 6,
  },
});
