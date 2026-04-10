from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.live import Live
from rich.markdown import Markdown
from rich.table import Table
from rich.text import Text
from prompt_toolkit import PromptSession
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.styles import Style

console = Console()

class EliteTUI:
    def __init__(self):
        self.layout = Layout()
        self.setup_layout()
        self.messages = []
        self.metrics = {
            "tokens": 0,
            "cost": 0.0,
            "tps": 0
        }

    def setup_layout(self):
        self.layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=3)
        )
        self.layout["main"].split_row(
            Layout(name="chat", ratio=3),
            Layout(name="sidebar", ratio=1)
        )

    def get_header(self):
        return Panel(
            Text("ELITE CODE v1.0.4", justify="center", style="bold magenta"),
            border_style="bright_blue"
        )

    def get_sidebar(self):
        table = Table(show_header=False, box=None)
        table.add_row("Tokens", str(self.metrics["tokens"]))
        table.add_row("Cost", f"${self.metrics['cost']:.4f}")
        table.add_row("TPS", str(self.metrics["tps"]))
        return Panel(table, title="Metrics", border_style="cyan")

    def get_chat(self):
        chat_content = ""
        for msg in self.messages:
            role = msg["role"].upper()
            color = "green" if role == "USER" else "yellow"
            chat_content += f"[{color} bold]{role}:[/] {msg['content']}\n\n"
        
        return Panel(Markdown(chat_content), title="Conversation", border_style="green")

    def update_display(self):
        self.layout["header"].update(self.get_header())
        self.layout["sidebar"].update(self.get_sidebar())
        self.layout["chat"].update(self.get_chat())

    async def run(self):
        session = PromptSession(history=InMemoryHistory())
        
        with Live(self.layout, refresh_per_second=4, screen=True):
            while True:
                self.update_display()
                try:
                    user_input = await session.prompt_async(">>> ")
                    if user_input.lower() in ["exit", "quit"]:
                        break
                    
                    self.messages.append({"role": "user", "content": user_input})
                    self.update_display()
                    
                    # AI logic would go here
                    self.messages.append({"role": "assistant", "content": "I am processing your request..."})
                    self.update_display()
                    
                except KeyboardInterrupt:
                    break
                except EOFError:
                    break

if __name__ == "__main__":
    import asyncio
    tui = EliteTUI()
    asyncio.run(tui.run())
